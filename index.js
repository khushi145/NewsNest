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


//global variables
let loggedIn = false;
let fetched = false;
let username = "";
let userEmail = "";
let subPlan = "";

//needed for displaying different categories with category.ejs
const categoryImageMap = new Map([
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

const categoryKeywordMap = new Map([
    ['Business & Finance',
        [
            "investment", "capital", "revenue", "profit", "loss", "assets", "liabilities", "stocks", "bonds", "entrepreneur", "market", "shareholder", "dividend", "budget", "economics", "currency", "inflation", "bankruptcy", "merger", "acquisitions", "debt", "credit", "taxation", "portfolio", "interest", "commodities", "real estate", "hedge fund", "ipo", "risk management"
        ]
    ],
    ['Crime & Justice',
        [
            "crime", "justice", "law", "police", "court", "judge", "prison", "criminal", "offense", "arrest", "evidence", "trial", "jury", "verdict", "sentence", "prosecutor", "defense", "attorney", "witness", "victim", "suspect", "investigation", "penalty", "parole", "probation", "correctional", "crime prevention", "rehabilitation", "capital punishment"
        ]
    ],
    ['Technology',
        [
            "technology", "innovation", "computer", "software", "hardware", "internet", "programming", "coding", "digital", "electronics", "cybersecurity", "data", "cloud", "network", "gadget", "AI", "automation", "robotics", "smart", "algorithm", "encryption", "biotechnology", "IoT", "VR", "AR", "nanotechnology", "startup", "tech-industry", "e-commerce"
        ]

    ],
    ['Politics',
        [
            "politics", "government", "election", "democracy", "legislation", "policy", "campaign", "voter", "candidate", "partisan", "bipartisan", "republican", "democrat", "congress", "senate", "house of representatives", "president", "prime minister", "parliament", "constitution", "lobbying", "political party", "civil rights", "foreign policy", "diplomacy", "public opinion", "polling", "debate", "corruption", "impeachment"
        ]
    ],
    ['Sports',
        [
            "sports", "athlete", "team", "competition", "tournament", "game", "match", "victory", "defeat", "score", "championship", "Olympics", "athlete", "soccer", "football", "basketball", "tennis", "baseball", "golf", "boxing", "swimming", "athletics", "rugby", "cycling", "equestrian", "gymnastics", "motorsport", "winter sports", "sportsmanship", "fan", "cricket"
        ]
    ],
    ['Medicine & Health',
        [
            "medicine", "health", "doctor", "hospital", "nurse", "patient", "diagnosis", "treatment", "pharmacy", "medication", "vaccine", "disease", "wellness", "nutrition", "exercise", "surgery", "therapy", "rehabilitation", "healthcare", "medical research", "public health", "emergency", "mental health", "physical therapy", "pediatrics", "cardiology", "oncology", "nutrition", "virus", "bacteria"
        ]

    ],
    ['Entertainment',
        [
            "entertainment", "Bollywood", "movie", "film", "television", "actor", "actress", "director", "producer", "script", "screenplay", "cinema", "drama", "comedy", "musical", "blockbuster", "box office", "awards", "red carpet", "celebrity", "star", "reel", "scene", "camera", "casting", "audition", "soundtrack", "film industry", "TV series", "showbiz", "paparazzi"
        ]
    ],
    ['Culture & Lifestyle',
        [
            "culture", "lifestyle", "tradition", "custom", "heritage", "art", "music", "food", "fashion", "festivals", "travel", "architecture", "language", "religion", "cuisine", "history", "diversity", "cultural exchange", "ritual", "craftsmanship", "cultural identity", "leisure", "well-being", "social norms", "community", "family", "values", "entertainment", "society", "trends", "celebration"
        ]
    ],
    ['Education',
        [
            "education", "school", "teacher", "student", "curriculum", "learning", "university", "college", "lecture", "homework", "exam", "degree", "literacy", "STEM", "arts", "research", "scholarship", "tuition", "pedagogy", "e-learning", "distance learning", "textbook", "library", "student-life", "extracurricular", "graduation", "vocational", "special-education", "edtech", "classroom-technology", "online-education"
        ]

    ]
]);

//news API
const apiKey = '5bad35b281884e4094573cf80266139d';
let newsResponse; //stores all articles for index.ejs and allArticles.ejs
let newsData; //stores newsData from above newsResponse

//function to display different articles every time refreshed
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

//function to return article from url
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
//index page
app.get('/', async (req, res) => {
    try {
        //to make sure articles aren't fetched everytime application is opened just the first time
        if (fetched === false) {
            newsResponse = await axios.get('https://newsapi.org/v2/everything?q=india&language=en&apiKey=5bad35b281884e4094573cf80266139d');
            newsData = newsResponse.data.articles;
            fetched = true;
        }
        const shuffledNews = shuffle(newsData);
        const randomNews = shuffledNews.slice(0, 10);
        res.render('index', { news: randomNews, subscription: subPlan, loggedIn, username });
    } catch (error) {
        res.status(500).send('Error fetching news data');
    }
});

//article displayed
app.get('/article/:title', async (req, res) => {
    try {

        //for other articles section
        const shuffledNews = shuffle(newsData);
        const randomNews = shuffledNews.slice(0, 5);

        //for main article
        const articleTitle = decodeURIComponent(req.params.title);
        const articleData = newsData.find(article => article.title === articleTitle); //finds article from newsData using title
        articleURL = articleData.url;
        extractArticleContent(articleURL) //extracts and returns articleContent
            .then(articleContent => {
                if (articleContent) {
                    res.render('article', { otherNews: randomNews, news: articleData, content: articleContent, subscription: subPlan, loggedIn, username });
                } else {
                    res.render('article', { otherNews: randomNews, news: articleData, content: articleData.content, subscription: subPlan, loggedIn, username });
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    } catch (error) {
        res.status(500).send('Error fetching news data');
    }
});

//login
app.get('/login', (req, res) => {
    if (loggedIn === false) {
        res.render('login');
    }
    else {
        res.redirect('/');
    }
});

//logout
app.get('/logout', (req, res) => {
    loggedIn = false;
    username = "";
    userEmail = "";
    res.redirect('/');
});

//submitting login
app.post("/login", async (req, res) => {
    const check = await collection.findOne({ email: req.body.email })
    if (check === null) {
        res.redirect('/login')
    }
    else if (check.password === req.body.password) {
        loggedIn = true;
        username = check.firstName;
        userEmail = check.email;
        subPlan = check.subscription;
        res.redirect('/');
    }
    else {
        res.redirect('/login')
    }
});

//signup
app.get('/signup', (req, res) => {
    if (loggedIn === false) {
        res.render('signup');
    }
    else {
        res.redirect('/');
    }
});


//submitting signup
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

//pricing (when logged in or logged out)
app.get('/subscribe', async (req, res) => {
    // try {
    //     const user = await collection.findOne({ email: userEmail });
    //     if (user) {
    //         res.render('subscribe', { subscription: user.subscription, loggedIn, username });
    //     } else {
    //         res.render('subscribe', { subscription: "User not found", loggedIn, username });
    //     }
    // } catch (error) {
    //     console.error(error);
    //     res.render('subscribe', { subscription: "User not found error", loggedIn, username });
    // }
    res.render('subscribe', { subscription: subPlan, loggedIn, username });
});

//pricing (when logged in and updating subscription plan)
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

//view more articles on index page
app.get('/allArticle', async (req, res) => {
    const shuffledNews = shuffle(newsData);
    const allNews = shuffledNews.slice(0, 48);
    res.render('allArticle', { news: allNews, subscription: subPlan, loggedIn, username });
});

//category page
app.get('/categories/:categoryName', async (req, res) => {
    //to get category name and banner img
    let categoryName = req.params.categoryName;
    categoryName = categoryName
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const categoryNumber = categoryImageMap.get(categoryName);

    //to get category articles
    const categoryWords = categoryKeywordMap.get(categoryName);
    const apiLink = 'https://newsapi.org/v2/everything?q=india AND ' + categoryWords.join(' OR ') + '&language=en&apiKey=5bad35b281884e4094573cf80266139d';
    const categoryResponse = await axios.get(apiLink); //stores all article responses for that category
    categoryData = categoryResponse.data.articles; //the data of those above responses

    // Create a set to keep track of unique article URLs
    const uniqueUrls = new Set(newsData.map(article => article.url));
    // Filter out duplicates and append the new articles
    const filteredCategoryData = categoryData.filter(article => !uniqueUrls.has(article.url));

    newsData = newsData.concat(filteredCategoryData);
    const shuffledNews = shuffle(categoryData);
    const categoryNews = shuffledNews.slice(0, 20);
    res.render('categories', { categoryName, categoryNumber, news: categoryNews, loggedIn, username });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
