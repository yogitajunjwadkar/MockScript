
const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

async function get_que(skill_arr) {
    try {
        await client.connect();

        const database = client.db('project');
        const coll = database.collection('question_bank');

        let final_list = [];
        const questionsPerSkill = 1;

        const skillAliases = {
            'java': 'java',
            'javascript': 'javascript',
            'react': 'react',
            'node.js': 'node.js',
            'express.js': 'express',
            'express': 'express',
            'mongodb': 'mongodb',
            'mongoose': 'mongoose',
            'api': 'rest api',
            'rest api': 'rest api',
            'git': 'git',
            'github': 'github',
            'postman': 'postman'
        };

        for (let skill of skill_arr) {
            const skill_name = skill.trim().toLowerCase();
            const dbSkill = skillAliases[skill_name] || skill_name;

            const questionData = await coll.findOne({
                skill: dbSkill
            });

            if (questionData && questionData.questions) {
                const questions = [...questionData.questions];

                questions.sort(() => Math.random() - 0.5);

                const selected = questions.slice(0, questionsPerSkill);

                final_list.push(...selected);

                console.log(`${skill} → ${selected.length} questions`);
            } else {
                console.log(`No question bank found for: ${skill} (DB: ${dbSkill})`);
            }
        }

        final_list = [...new Set(final_list)];

        console.log('Total Questions:', final_list.length);

        return final_list;

    } catch (error) {
        console.error('Question Generation Error:', error);
        throw error;
    }
}

module.exports = get_que;
