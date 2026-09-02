# Form — SAT Practice

A focused digital SAT practice site with 100 original questions:

- 50 Reading and Writing questions
- 50 Math questions
- easy, medium, and hard progression in each section
- answer explanations, bookmarks, a question navigator, and locally saved progress
- a responsive black-and-white interface with no build step

## Live site

[Open Form SAT Practice](https://clwx-31.github.io/crctsatact/)

## Run the site

From this directory, start a local server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. The site can also be opened directly through `index.html`, although a local server is more consistent across browsers.

## Validate the bank

With Node.js installed:

```sh
node validate.js
node --check app.js
node --check questions.js
```

The validator checks question counts, unique IDs, required fields, answer formats, tables, and the intended domain and difficulty distributions.

## Calibration standard

All practice items are original. Format, content coverage, and question taxonomy were calibrated against current College Board materials:

- [Reading and Writing specifications](https://satsuite.collegeboard.org/k12-educators/about/alignment/reading)
- [Math specifications](https://satsuite.collegeboard.org/k12-educators/about/alignment/math)
- [Official student question bank guidance](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing)
- [Digital SAT sample questions and explanations](https://satsuite.collegeboard.org/media/pdf/digital-sat-sample-questions.pdf)

This project is independent and is not affiliated with or endorsed by College Board. SAT is a registered trademark of College Board.
