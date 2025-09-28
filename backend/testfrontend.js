const firebaseConfig = {
  apiKey: "AIzaSyCRFLkrQn_RA-csNMnSHeG7qvJj0pIrZ1Q",
  authDomain: "scheduling-of-care.firebaseapp.com",
  projectId: "scheduling-of-care",
  storageBucket: "scheduling-of-care.firebasestorage.app",
  messagingSenderId: "645599244862",
  appId: "1:645599244862:web:f60b096c5115669ff6976f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function signIn() {
    console.log("Attempting to sign in user");
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(credential => {
            console.log("signed in: ", credential.user.email);
            const user = credential.user;
            const token = user.getIdToken();
            
            console.log(token);
        })
        .catch(error => {
            console.error("sign in error: ", error.message);
        })

}