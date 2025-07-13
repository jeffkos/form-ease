// Routes des champs de formulaire pour FormEase
const express = require('express');
const router = express.Router();
const formFieldController = require('../controllers/formFieldController');
const { default: auth } = require('../middleware/auth');

// Ajouter un champ à un formulaire (authentifié)
router.post('/:formId/fields', auth, formFieldController.addField);
// Lister les champs d'un formulaire (authentifié)
router.get('/:formId/fields', auth, formFieldController.listFields);
// Modifier un champ (authentifié)
router.put('/fields/:fieldId', auth, formFieldController.updateField);
// Supprimer un champ (authentifié)
router.delete('/fields/:fieldId', auth, formFieldController.deleteField);

module.exports = router;
