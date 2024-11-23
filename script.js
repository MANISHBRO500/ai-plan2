// Include your API keys
const OPEN_WEATHER_API_KEY = 'your_openweather_api_key';
const UNSPLASH_API_KEY = 'your_unsplash_api_key';
const NEWS_API_KEY = 'your_news_api_key';
const OPENAI_API_KEY = 'your_openai_api_key';

const searchBox = document.getElementById('searchBox');
const listenButton = document.getElementById('listenButton');
const responseDiv = document.getElementById('response');

// Start Listening (Speech Recognition)
listenButton.addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event) => {
        const query = event.results[0][0].transcript;
        searchBox.value = query;
        handleQuery(query);
    };
});

// Handle Manual Search
searchBox.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleQuery(searchBox.value);
    }
});

// Handle Query
async function handleQuery(query) {
    if (query.toLowerCase().includes('weather')) {
        const weatherData = await fetchWeather(query);
        responseDiv.textContent = `Weather Info: ${weatherData}`;
    } else if (query.toLowerCase().includes('image')) {
        const imageUrl = await fetchUnsplash(query);
        responseDiv.innerHTML = `<img src="${imageUrl}" alt="Image" style="max-width: 100%;">`;
    } else if (query.toLowerCase().includes('news')) {
        const newsData = await fetchNews(query);
        responseDiv.textContent = `News: ${newsData}`;
    } else {
        const aiResponse = await fetchOpenAIResponse(query);
        responseDiv.textContent = `AI: ${aiResponse}`;
    }
}

// Fetch Weather Info
async function fetchWeather(query) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${OPEN_WEATHER_API_KEY}`);
    const data = await response.json();
    return `Temperature: ${(data.main.temp - 273.15).toFixed(2)}°C, Condition: ${data.weather[0].description}`;
}

// Fetch Unsplash Image
async function fetchUnsplash(query) {
    const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&client_id=${UNSPLASH_API_KEY}`);
    const data = await response.json();
    return data.urls.regular;
}

// Fetch News
async function fetchNews(query) {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&apiKey=${NEWS_API_KEY}`);
    const data = await response.json();
    return data.articles.length > 0 ? data.articles[0].title : 'No news found.';
}

// Fetch OpenAI Response
async function fetchOpenAIResponse(query) {
    const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: query,
            max_tokens: 100,
        }),
    });
    const data = await response.json();
    return data.choices[0].text.trim();
}
