let score = 0;
let health = 3;
let gameRunning = false;

$("#nameBtn").click(function () {

    let name = $("#playerName").val();

    // Guest mode
    if (name === "") {

        let randomNumber = Math.floor(Math.random() * 1000);

        name = "Guest" + randomNumber;
    }

    $("#greeting").text("Welcome, " + name + "!");

    sessionStorage.setItem("playerName", name);
});

$("#startBtn").click(function () {

    gameRunning = true;

    score = 0;
    health = 3;

    $("#score").text(score);
    $("#health").text(health);

    console.log("Game started!");
});

$("#resetBtn").click(function () {

    score = 0;
    health = 3;
    gameRunning = false;

    $("#score").text(score);
    $("#health").text(health);

    $("#worm").css({
        left: "50px",
        top: "50px"
    });

});

$("#gameBoard").mousemove(function (event) {

    if (gameRunning === false) {
        return;
    }

    let board = $(this).offset();

    let mouseX = event.pageX - board.left;
    let mouseY = event.pageY - board.top;

    $("#worm").css({
        left: mouseX,
        top: mouseY
    });

    checkPear();
    checkHazard();

});

function checkPear() {

    let worm = $("#worm").position();
    let pear = $("#pear").position();

    let distanceX = Math.abs(worm.left - pear.left);
    let distanceY = Math.abs(worm.top - pear.top);

    if (distanceX < 30 && distanceY < 30) {

        score += 10;

        $("#score").text(score);

        movePear();

        if (score >= 30) {

            alert("You win!");

            gameRunning = false;
        }
    }

}

function movePear() {

    let randomX = Math.floor(Math.random() * 550);
    let randomY = Math.floor(Math.random() * 350);

    $("#pear").css({
        left: randomX,
        top: randomY
    });

}

function checkHazard() {

    let worm = $("#worm").position();
    let hazard = $("#hazard").position();

    let distanceX = Math.abs(worm.left - hazard.left);
    let distanceY = Math.abs(worm.top - hazard.top);

    if (distanceX < 30 && distanceY < 30) {

        health--;

        $("#health").text(health);

        // jQuery UI effect
        $("#worm").effect("shake");

        moveHazard();

        if (health <= 0) {

            alert("Game Over! Score: " + score);

            gameRunning = false;
        }

    }

}

function moveHazard() {

    let randomX = Math.floor(Math.random() * 550);
    let randomY = Math.floor(Math.random() * 350);

    $("#hazard").css({
        left: randomX,
        top: randomY
    });

}

function showTime() {

    let now = new Date();

    $("#dateTime").text(now.toLocaleString());

}

showTime();

function cheatMode() {

    score = 100;
    health = 99;

    $("#score").text(score);
    $("#health").text(health);

    console.log("WORM GOD MODE ACTIVATED 🪱");

}