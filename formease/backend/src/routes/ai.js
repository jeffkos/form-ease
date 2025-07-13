const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();
const { default: auth } = require('../middleware/auth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/generate-form', auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en création de formulaires. 
          Génère un formulaire JSON avec les champs appropriés basés sur la description.
          Inclus: titre, description, champs (type, label, validation), et thème.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const formStructure = JSON.parse(completion.choices[0].message.content);
    res.json(formStructure);
  } catch (error) {
    console.error('Erreur de génération du formulaire:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du formulaire' });
  }
});

router.post('/improve-form', auth, async (req, res) => {
  try {
    const { form, feedback } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en amélioration de formulaires. 
          Améliore le formulaire existant en fonction du feedback utilisateur.
          Conserve la structure mais modifie ou ajoute des champs selon les besoins.`
        },
        {
          role: "user",
          content: `Formulaire actuel : ${JSON.stringify(form)}
          Feedback : ${feedback}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const improvedForm = JSON.parse(completion.choices[0].message.content);
    res.json(improvedForm);
  } catch (error) {
    console.error('Erreur d\'amélioration du formulaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'amélioration du formulaire' });
  }
});

module.exports = router;
