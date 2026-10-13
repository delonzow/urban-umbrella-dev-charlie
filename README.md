# Worm Simulator (urban-umbrella-dev-charlie)
> fun game where you fight to survive!

## authorship
- [Delonzo Weaver](https://github.com/delonzow), October 8th 2026, Version 1.0

## user story 
- **as a gamer**
- **i want to play a difficult game**
- **so that life isnt as boring and I can feel better about myself for beating a challenging game!** 

## narrative

> You are the worm.
> In this game world, life is cruel, and every day is a struggle to survive. Thankfully it has a gamer like YOU to control it. Without you guiding it, it would've perished a long time ago... Help the worm survive!

## about the app

###

### wireframe & game ideas

- [wiki/wireframe](https://github.com/delonzow/urban-umbrella-dev-charlie/wiki/Wireframe)
- [issue/game idea](https://github.com/delonzow/urban-umbrella-dev-charlie/issues/1)


### project directory structure

```test
urban-umbrella-dev-charlie-main/
├───index.html
├───README.md
├───assets/
│   ├───scripts/
│   │       ├───full-game-script.js
│   │       └───game-script.js
│   │       
│   └───styles/
│           ├───full-game-styles.css
│           └───styles.css
└───pages/
        full-game.html
```

### tech stack
- HTML5
- CSS
- JavaScript
- Google Fonts
- Bootstrap

### code snippet

- this code allows the user to reset the game when pressing a button 

```js
$("#resetBtn").click(function () {
  score = 0;
  health = 3;
  gameRunning = false;

  $("#score").text(score);
  $("#health").text(health);

  $("#worm").css({
    left: "50px",
    top: "50px",
  });
});

```


### my future ideas!
> check out Sprint 99 for future app ideas!

- [my milestone/sprint 99](https://github.com/delonzow/urban-umbrella-dev-charlie/milestone/1)
