

const express = require('express');
const app = express();
const multer = require('multer');
const body_parser = require('body-parser');
const connect = require('./mongodb');
const get_que = require('./getquestion');
const pdftotext = require('./resumeparser');
const cors = require('cors');
const chatgpt = require('./chatgpt');
const compare = require('./compare-api');
const retrieve = require('./retrieve_data');

// Middleware
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use('/static', express.static(__dirname + '/public'));
app.use(cors());

app.set('view engine', 'ejs');

// Interview data
let q_list = [];
let user_ans = [];

// Cache Gemini results
let expectedAnswersCache = null;
let comparisonCache = null;

// Login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Home page
app.get('', (req, res) => {
    res.render('home');
});

// Login POST
app.post('/login', async (req, res) => {
    try {
        const check_res = await login_check(req.body);

        if (check_res) {
            res.send({ result: true });
        } else {
            res.send({ result: false });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).send({ error: 'Login failed' });
    }
});

// Login validation
async function login_check(body) {
    const coll = await connect();

    const data = await coll.find({
        email: body.email,
        pass: body.pass
    }).toArray();

    return data.length > 0;
}

// Signup validation
async function signup_check(body) {
    const coll = await connect();

    const data = await coll.find({
        email: body.email
    }).toArray();

    return data.length === 0;
}

// Signup POST
app.post('/sign-up', async (req, res) => {
    try {
        const check_res = await signup_check(req.body);

        if (check_res) {
            const coll = await connect();

            await coll.insertOne({
                email: req.body.email,
                Name: req.body.name,
                pass: req.body.pass
            });

            res.send({ result: true });
        } else {
            res.send({ result: false });
        }
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).send({ error: 'Signup failed' });
    }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
    try {
        const coll = await connect();

        const data = await coll.find({
            email: req.query.email
        }).toArray();

        if (!data.length) {
            return res.status(404).send({
                error: 'User not found'
            });
        }

        const profile = data[0].Name;

        res.render('dashboard', { profile });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send({ error: 'Dashboard failed' });
    }
});

// Resume upload storage
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/upload');
    },

    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

const uploads = multer({ storage: storage });

// Resume recognition
app.post('/resume-recognize', uploads.array('file'), async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.files);

        const file_data = await pdftotext(
            __dirname + '/upload/user-resume.pdf'
        );

        console.log(file_data);

        const arr = retrieve(file_data);

        const final = await get_que(arr);

        console.log(final);

        q_list = final;

        // Reset previous interview data
        user_ans = [];
        expectedAnswersCache = null;
        comparisonCache = null;

        res.send({ data: arr });

    } catch (error) {
        console.error('Resume Recognition Error:', error);

        res.status(500).send({
            error: 'Resume processing failed'
        });
    }
});

// Interview page
app.get('/interview', (req, res) => {
    res.render('interview');
});

// Send questions
app.get('/get-questions', (req, res) => {
    res.send({ data: q_list });
});

// Receive user answers
app.post('/feedback', async (req, res) => {
    try {
        user_ans = Array.isArray(req.body.ans_arr)
            ? req.body.ans_arr
            : [];

        // Reset comparison when new answers arrive
        comparisonCache = null;

        console.log('User Answers:', user_ans);

        res.send({ response: 'Successful' });

    } catch (error) {
        console.error('Feedback Error:', error);

        res.status(500).send({
            error: 'Feedback submission failed'
        });
    }
});

// Result page
app.get('/result', (req, res) => {
    res.render('result');
});

// Performance Analysis
app.get('/performance-analysis', async (req, res) => {
    try {
        if (!q_list || q_list.length === 0) {
            return res.status(400).send({
                error: 'No interview questions available'
            });
        }

        if (!user_ans || user_ans.length === 0) {
            return res.status(400).send({
                error: 'No user answers available'
            });
        }

        // Generate expected answers once
        if (!expectedAnswersCache) {
            expectedAnswersCache = await chatgpt(q_list);

            console.log(
                'Expected answers generated and cached.'
            );
        }

        // Evaluate answers once
        if (!comparisonCache) {
            comparisonCache = await compare(
                expectedAnswersCache,
                user_ans
            );

            console.log(
                'Comparison completed and cached.'
            );
        }

        // Calculate attempted answers
        const attempted = user_ans.filter(
            answer => answer && answer.trim().length > 0
        );

        // Calculate accuracy
        const validScores = comparisonCache
            .filter(item =>
                item.status === 'Compared' &&
                item.similarity !== null
            )
            .map(item => item.similarity);

        const accuracy = validScores.length
            ? Math.round(
                validScores.reduce(
                    (sum, score) => sum + score, 0
                ) / validScores.length
            )
            : 0;

        // Calculate average answer length
        const totalCharacters = attempted.reduce(
            (sum, answer) => sum + answer.length,
            0
        );

        const averageAnswerLength = attempted.length
            ? Math.round(totalCharacters / attempted.length)
            : 0;

        // Send performance data
        res.send({
            data: comparisonCache,
            q_list: q_list,
            accuracy: accuracy,
            totalQuestions: q_list.length,
            attemptedQuestions: attempted.length,
            averageAnswerLength: averageAnswerLength
        });

    } catch (error) {
        console.error('Performance Analysis Error:', error);

        expectedAnswersCache = null;
        comparisonCache = null;

        res.status(500).send({
            error: 'Performance analysis failed'
        });
    }
});

// Start server
app.use('/static', express.static('public'));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Started on port ${PORT}`);
});