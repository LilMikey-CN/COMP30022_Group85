const express = require("express");
const admin = require("firebase-admin");
const { randomBytes } = require("node:crypto");

const accessCodeLength = 6

// Initialize Express
const app = express();
const port = 3000;

// initialize firebase admin
const serviceAccount = require("./firebaseAdminConfig.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Parse incoming requests with JSON payload
app.use(express.json());

const db = admin.firestore();

// Welcome message
app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

// Create new client
app.post("/clients/create", async (req, res) => {
  try {
    const clientAccessCode = randomBytes(accessCodeLength).toString("hex");
    const clientData = { ...req.body, clientAccessCode };
    const docRef = await db.collection("Client").add(clientData);
    res
      .status(201)
      .send({ message: "Document added successfully", id: docRef.id });
  } catch (error) {
    console.error("Error adding document: ", error);
    res
      .status(500)
      .send({ message: "Error adding document", error: error.message });
  }
});

// Read all clients
app.get("/clients", async (req, res) => {
  try {
    const snapshot = await db.collection("Client").get();
    const clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients: ", error);
    res
      .status(500)
      .send({ message: "Error fetching clients", error: error.message });
  }
});

// Read single client
app.get("/clients/:clientID", async (req, res) => {
  try {
    const { clientID } = req.params;
    const docRef = db.collection("Client").doc(clientID);
    const doc = await docRef.get();

    res.json(doc.data());
  } catch (error) {
    console.error("Error getting document: ", error);
    res
      .status(500)
      .send({ message: "Error getting document", error: error.message });
  }
});

// Delete client
app.delete("/clients/:clientID", async (req, res) => {
  try {
    const { clientID } = req.params;
    const docRef = db.collection("Client").doc(clientID);
    const clientDoc = await docRef.get();

    if (!clientDoc.exists) {
      return res.status(404).send({ message: "Document not found" });
    }

    await docRef.delete();
    res.status(200).send({ message: "Document deleted successfully" });

    // Delete client's care items
    const snapshot = await db
      .collection("CareItem")
      .where("clientID", "==", clientID)
      .get();

    for (const doc of snapshot.docs) {
    
      if (!doc.exists) {
        return res.status(404).send({ message: "Document not found" });
      }

      if (doc.data().clientID !== clientID) {
        return res.status(403).send({ message: "Permission denied" });
      }

      await doc.ref.delete();
    }

  } catch (error) {
    console.error("Error deleting document: ", error);
    res
      .status(500)
      .send({ message: "Error deleting document", error: error.message });
  }
});

// Update client
app.put("/clients/:clientID", async (req, res) => {
  try {
    const { clientID } = req.params;
    const data = req.body;

    const docRef = db.collection("Client").doc(clientID);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send({ message: "Document not found" });
    }

    await docRef.update(data);
    res.status(200).send({ message: "Document updated successfully" });
  } catch (error) {
    console.error("Error updating document: ", error);
    res
      .status(500)
      .send({ message: "Error updating document", error: error.message });
  }
});

// Create care item for client
app.post("/clients/:clientID/CareItem", async (req, res) => {
  try {
    const { clientID } = req.params;

    // Check client exists
    const clientRef = db.collection("Client").doc(clientID);
    const clientDoc = await clientRef.get();
    if (!clientDoc.exists) {
      return res.status(404).send({ message: "Client not found" });
    }

    const careTaskData = { ...req.body, clientID };
    const docRef = await db.collection("CareItem").add(careTaskData);
    res
      .status(201)
      .send({ message: "Document added successfully", id: docRef.id });
  } catch (error) {
    console.error("Error adding document: ", error);
    res
      .status(500)
      .send({ message: "Error adding document", error: error.message });
  }
});

// Read all care items for client
app.get("/clients/:clientID/CareItem", async (req, res) => {
  try {
    const { clientID } = req.params;
    const snapshot = await db
      .collection("CareItem")
      .where("clientID", "==", clientID)
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    console.error("Error getting documents: ", error);
    res
      .status(500)
      .send({ message: "Error getting documents", error: error.message });
  }
});

// Update care item
app.put("/clients/:clientID/CareItem/:careItemId", async (req, res) => {
  try {
    const { clientID: clientID, careItemId } = req.params;
    const data = req.body;

    const docRef = db.collection("CareItem").doc(careItemId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send({ message: "Document not found" });
    }

    if (doc.data().clientID !== clientID) {
      return res.status(403).send({ message: "Permission denied" });
    }

    await docRef.update(data);
    res.status(200).send({ message: "Document updated successfully" });
  } catch (error) {
    console.error("Error updating document: ", error);
    res
      .status(500)
      .send({ message: "Error updating document", error: error.message });
  }
});

// Delete a care item for client
app.delete("/clients/:clientID/CareItem/:careItemId", async (req, res) => {
  try {
    const { clientID, careItemId } = req.params;
    const docRef = db.collection("CareItem").doc(careItemId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send({ message: "Document not found" });
    }

    if (doc.data().clientID !== clientID) {
      return res.status(403).send({ message: "Permission denied" });
    }

    await docRef.delete();
    res.status(200).send({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document: ", error);
    res
      .status(500)
      .send({ message: "Error deleting document", error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});