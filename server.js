const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')

const app = express();

const port = 3000;

const serviceAccount = require('./firebaseAdminConfig.json')

app.use(express.json());

// initialize firebase admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

app.post('/create', async (req, res) => {
    try{
        const db = admin.firestore(); // <-- You need this line here
        const data = req.body; 
        const docRef = await db.collection('CareItem').add(data);
        res.status(201).send({ message: 'Document added successfully', id: docRef.id });
    } catch (error) {
         console.error('Error adding document: ', error);
        res.status(500).send({ message: 'Error adding document', error: error.message });
    }
})

app.post('/update', async(req, res) => {
    try {
        const db = admin.firestore();
        const { id, ...data } = req.body;

        const docRef = db.collection('CareItem').doc(id);

        await docRef.update(data);
        
        res.status(200).send({ message: 'Document updated successfully' });

    } catch (error) {
        console.error('Error updating document: ', error);
        res.status(500).send({ message: 'Error updating document', error: error.message });
    }
})

app.get('/CareItem', async (req, res) => {
    const db = admin.firestore();

    try {
        const snapshot = await db.collection('CareItem').get()
        const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() }))

        res.json(data)
    } catch (error) {
        res.status(500).send(error)
    }
})

app.delete('/delete/:id', async (req, res) => {
    try{
        const db = admin.firestore();
        const docId = req.params.id; // Get the ID from the URL parameter

        const docRef = db.collection('CareItem').doc(docId);

        // This will throw an error if the document does not exist,
        // which will be caught by the catch block below.
        await docRef.delete();

        res.status(200).send({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document: ', error);
        res.status(500).send({ message: 'Error deleting document', error: error.message });
    }
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
}) 