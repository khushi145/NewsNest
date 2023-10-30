const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios')
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const collection = require("./mongodb")
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.static('public'))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

let loggedIn = false;
let username = "";
let userEmail = "";

const categoryMap = new Map([
    ['Business & Finance', 1],
    ['Crime & Justice', 2],
    ['Technology', 3],
    ['Politics', 4],
    ['Sports', 5],
    ['Medicine & Health', 6],
    ['Entertainment', 7],
    ['Culture & Lifestyle', 8],
    ['Education', 9]
]);

//news API

const apiKey = '5bad35b281884e4094573cf80266139d';
let newsResponse;
let newsData;

//functions

function shuffle(array) {
    let currentIndex = array.length, randomIndex, temporaryValue;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

async function extractArticleContent(url) {
    try {
        const response = await axios.get(url);
        const dom = new JSDOM(response.data, { url, });
        const article = new Readability(dom.window.document).parse();
        return article.textContent;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

//routes

app.get('/', async (req, res) => {
    try {
        newsResponse = await axios.get('https://newsapi.org/v2/everything?q=india&apiKey=5bad35b281884e4094573cf80266139d');
        newsData = newsResponse.data.articles;
        const shuffledNews = shuffle(newsData);
        const randomNews = shuffledNews.slice(0, 10);
        res.render('index', { news: randomNews, loggedIn, username });
    } catch (error) {
        res.status(500).send('Error fetching news data');
    }
});

app.get('/article/:title', (req, res) => {
    const articleTitle = decodeURIComponent(req.params.title);

    const articleData = newsData.find(article => article.title === articleTitle);
    articleURL = articleData.url;
    extractArticleContent(articleURL)
        .then(articleContent => {
            if (articleContent) {
                res.render('article', { news: articleData, content: articleContent, loggedIn, username });
            } else {
                res.render('article', { news: articleData, content: articleData.content, loggedIn, username });
                console.log('Failed to extract article content.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

app.get('/login', (req, res) => {
    res.render('login', { loggedIn, username });
});

app.get('/logout', (req, res) => {
    loggedIn = false;
    username = "";
    userEmail = "";
    res.redirect('/');
});

app.post("/login", async (req, res) => {
    const check = await collection.findOne({ email: req.body.email })
    if (check === null) {
        res.redirect('/login')
    }
    else if (check.password === req.body.password) {
        loggedIn = true;
        username = check.firstName;
        userEmail = check.email;
        res.redirect('/');
    }
    else {
        res.redirect('/login')
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', { loggedIn, username });
});

app.post("/signup", async (req, res) => {
    const data = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        subscription: req.body.subscription,
        email: req.body.email,
        password: req.body.password
    }
    await collection.insertMany([data])
    res.redirect('/login');
});

app.get('/subscribe', async (req, res) => {
    try {
        const user = await collection.findOne({ email: userEmail });
        if (user) {
            res.render('subscribe', { subscription: user.subscription, loggedIn, username });
        } else {
            res.render('subscribe', { subscription: "User not found", loggedIn, username });
        }
    } catch (error) {
        console.error(error);
        res.render('subscribe', { subscription: "User not found error", loggedIn, username });
    }
});


app.post('/subscribe', async (req, res) => {
    try {
        const result = await collection.updateOne(
            { email: userEmail },
            { $set: { subscription: req.body.newPlan } }
        );
        res.redirect('/subscribe');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/allArticle', (req, res) => {
    res.render('allArticle', { loggedIn, username });
});

app.get('/categories/:categoryName', (req, res) => {
    let categoryName = req.params.categoryName;
    categoryName = categoryName
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const categoryNumber = categoryMap.get(categoryName);
    res.render('categories', { categoryName, categoryNumber, loggedIn, username });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
