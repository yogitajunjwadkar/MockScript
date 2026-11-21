
function retrieve(data) {
    data = data.toLowerCase();

    const skills = {
        "C": ["c"],
        "C++": ["c++"],
        "C#": ["c#"],
        "Java": ["java"],
        "Python": ["python"],
        "JavaScript": ["javascript", "js"],
        "TypeScript": ["typescript"],
        "HTML": ["html"],
        "CSS": ["css"],
        "React": ["react", "reactjs", "react.js"],
        "React Native": ["react native"],
        "Node.js": ["nodejs", "node.js", "node js"],
        "Express.js": ["expressjs", "express.js", "express"],
        "MongoDB": ["mongodb", "mongo db"],
        "Mongoose": ["mongoose"],
        "SQL": ["sql"],
        "MySQL": ["mysql"],
        "PostgreSQL": ["postgresql"],
        "Oracle": ["oracle"],
        "DBMS": ["dbms"],
        "OOP": ["oop", "object oriented programming"],
        "Data Structures": ["data structure", "data structures", "dsa"],
        "Operating System": ["operating system", "os"],
        "Computer Networks": ["computer network", "computer networks"],
        "REST API": ["rest api", "restful api"],
        "API": ["api"],
        "Git": ["git"],
        "GitHub": ["github"],
        "Postman": ["postman"],
        "AWS": ["aws", "amazon web services"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes"],
        "Angular": ["angular", "angularjs"],
        "Vue.js": ["vue.js", "vuejs"],
        "Next.js": ["next.js", "nextjs"],
        "Bootstrap": ["bootstrap"],
        "Tailwind CSS": ["tailwind css"],
        "jQuery": ["jquery"],
        "PHP": ["php"],
        "Laravel": ["laravel"],
        "Django": ["django"],
        "Flask": ["flask"],
        "Spring Boot": ["spring boot", "springboot"],
        "Machine Learning": ["machine learning"],
        "Artificial Intelligence": ["artificial intelligence", "ai"],
        "Data Science": ["data science"],
        "Cyber Security": ["cyber security"],
        "Firebase": ["firebase"],
        "Redux": ["redux"],
        "JSON": ["json"],
        "XML": ["xml"],
        "Agile": ["agile"],
        "Jest": ["jest"],
        "Selenium": ["selenium"],
        "Figma": ["figma"]
    };

    const result = [];

    for (const [skill, aliases] of Object.entries(skills)) {

        const found = aliases.some(alias => {
            const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const regex = alias === "c"
                ? /(^|[^a-z0-9])c(?![+#a-z0-9])/i
                : new RegExp(
                    `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
                    "i"
                );

            return regex.test(data);
        });

        if (found) {
            result.push(skill);
        }
    }

    console.log("Detected Skills:", result);

    return result;
}

module.exports = retrieve;
