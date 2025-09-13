// login.js
// Ce script gère la connexion utilisateur avec Supabase

// Remplacez par votre URL et clé Supabase
const SUPABASE_URL = "https://osqzuptinfbahmfncjgl.supabase.co";
const SUPABASE_KEY = "sb_publishable_WkM4ZZIJQdMO7JVayxYh1Q_FRjMqUx_";

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    // Vérification utilisateur via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?name=eq.${encodeURIComponent(name)}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    });
    const users = await response.json();
    if (users.length > 0 && users[0].password === password) {
        alert('Connexion réussie !');
        // Rediriger ou stocker l'état de connexion ici
    } else {
        alert('Nom ou mot de passe incorrect.');
    }
});
