
console.log("RESULT JS FILE LOADED");

// Fetch performance analysis when page loads
document.addEventListener("DOMContentLoaded", () => {
    get_data();
});

async function get_data() {
    console.log("GET DATA FUNCTION STARTED");

    try {
        const response = await fetch("/performance-analysis");

        console.log("API STATUS:", response.status);

        if (!response.ok) {
            throw new Error("Performance API failed: " + response.status);
        }

        const data = await response.json();

        console.log("API DATA RECEIVED:", data);

        add_data(data);

        console.log("RESULT RENDERED");

    } catch (error) {
        console.error("Performance Analysis Error:", error);

        const loadingBox = document.getElementById("loadingBox");

        if (loadingBox) {
            loadingBox.innerHTML =
                "<h2>Unable to analyze performance. Please try again.</h2>";
        }
    }
}


// Display performance analysis
function add_data(data) {

    const loadingBox = document.getElementById("loadingBox");
    const main2 = document.querySelector(".main2");
    const main3 = document.querySelector(".main3");
    const space = document.querySelector(".space");

    if (!loadingBox || !main2 || !main3 || !space) {
        throw new Error("Required HTML elements are missing. Check result.ejs");
    }

    loadingBox.style.display = "none";
    main2.style.display = "block";
    main3.style.display = "block";
    space.style.display = "block";

    const comparison = data.data || [];
    const questions = data.q_list || [];

    // Attempted answers
    const attempted = comparison.filter(
        item => item.userAnswer && item.userAnswer.trim() !== ""
    );

    // Calculate accuracy
    const scores = comparison
        .filter(item =>
            item.status === "Compared" &&
            item.similarity !== null &&
            item.similarity !== undefined
        )
        .map(item => Number(item.similarity));

    const accuracy = scores.length
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
        )
        : 0;

    // Calculate average answer length
    const averageLength = attempted.length
        ? Math.round(
            attempted.reduce(
                (sum, item) => sum + item.userAnswer.length, 0
            ) / attempted.length
        )
        : 0;

    const totalAttempted = attempted.length;
    const totalQuestions = questions.length;

    // Update progress bars
    updateBar("accuracyBar", accuracy);

    updateBar(
        "lengthBar",
        Math.min(100, (averageLength / 500) * 100)
    );

    updateBar(
        "attemptBar",
        totalQuestions
            ? (totalAttempted / totalQuestions) * 100
            : 0
    );

    // Update text values
    document.getElementById("accuracyText").innerText =
        accuracy + "%";

    document.getElementById("lengthText").innerText =
        averageLength + " / 500 characters";

    document.getElementById("attemptText").innerText =
        totalAttempted + " / " + totalQuestions + " Questions";

    // Question-by-question comparison
    const container = document.getElementById("comparisonContainer");

    if (!container) {
        throw new Error("comparisonContainer not found in result.ejs");
    }

    container.innerHTML = "";

    comparison.forEach((item, index) => {

        const card = document.createElement("div");
        card.className = "data";

        card.innerHTML = `
            <div class="data_item">
                <h3>Question ${index + 1}</h3>
                <p></p>
            </div>

            <div class="data_item">
                <h3>Your Answer</h3>
                <p></p>
            </div>

            <div class="data_item">
                <h3>Expected Answer</h3>
                <p></p>
            </div>

            <div class="data_item">
                <h3>Accuracy Score</h3>
                <p></p>
            </div>

            <div class="data_item">
                <h3>Gemini Feedback</h3>
                <p></p>
            </div>
        `;

        const paragraphs = card.querySelectorAll("p");

        paragraphs[0].textContent =
            questions[index] || "Question not available";

        paragraphs[1].textContent =
            item.userAnswer || "Not Attempted";

        paragraphs[2].textContent =
            item.expectedAnswer || "Not available";

        paragraphs[3].textContent =
            item.similarity !== null && item.similarity !== undefined
                ? item.similarity + "%"
                : "Not evaluated";

        paragraphs[4].textContent =
            item.feedback || item.status || "No feedback";

        container.appendChild(card);
    });
}


// Update progress bars
function updateBar(id, value) {

    const bar = document.getElementById(id);

    if (!bar) {
        throw new Error(id + " element not found in result.ejs");
    }

    const safeValue = Math.max(
        0,
        Math.min(100, Number(value) || 0)
    );

    bar.style.width = safeValue + "%";

    bar.setAttribute(
        "data-text",
        Math.round(safeValue) + "%"
    );
}
