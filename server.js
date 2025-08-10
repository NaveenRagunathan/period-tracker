require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ChatMistralAI } = require('@langchain/mistralai');
const { HumanMessage } = require('@langchain/core/messages');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const model = new ChatMistralAI({
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-large-latest',
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const systemMessage = new HumanMessage(
            'You are a helpful and supportive health assistant. ' +
            'Provide concise and informative answers to questions about menstruation, periods, and women\'s health. ' +
            'Focus on answering the user\'s question directly. ' +
            'Do not provide medical advice. For any serious health concerns, you must advise the user to consult a doctor.'
        );
        const userMessage = new HumanMessage(message);

        const response = await model.invoke([systemMessage, userMessage]);

        res.json({ reply: response.content });
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Failed to get a response from the chatbot.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
