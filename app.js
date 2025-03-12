require('dotenv').config(); // Carregar variáveis de ambiente

const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors'); // Importação do CORS
const jwt = require('jsonwebtoken');

const app = express();

// Configuração do CORS para permitir todas as origens
app.use(cors());

// Configuração para receber JSON no corpo das requisições
app.use(express.json());

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

// Models
const User = require('./models/User');

// Rota inicial
app.get('/', (req, res) => {
    res.status(200).json({ msg: "Opa" });
});

// Rota privada (requer autenticação)
app.get('/user/:id', checkToken, async (req, res) => {
    const id = req.params.id;

    // Verificar se o usuário existe
    const user = await User.findById(id, '-password');

    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado!' });
    }

    res.status(200).json({ user });
});

// Middleware para verificar o token JWT
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ msg: 'Acesso negado!' });

    try {
        const secret = process.env.SECRET;
        jwt.verify(token, secret);
        next();
    } catch (error) {
        res.status(400).json({ msg: "Token inválido!" });
    }
}

// Registrar usuário
app.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validações
    if (!email) {
        return res.status(422).json({ msg: 'Email obrigatório!' });
    }
    if (!password) {
        return res.status(422).json({ msg: 'Senha obrigatória!' });
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email: email });

    if (userExists) {
        return res.status(422).json({ msg: 'Esse email já está em uso!' });
    }

   

    // Criar usuário
    const user = new User({
        name: name || null, // Nome é opcional
        email,
        password
    });

    try {
        await user.save();
        res.status(201).json({ msg: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente mais tarde!" });
    }
});

// Login do usuário
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(422).json({ msg: 'Email obrigatório!' });
    }
    if (!password) {
        return res.status(422).json({ msg: 'Senha obrigatória!' });
    }

    // Verificar se o usuário existe
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(422).json({ msg: 'Usuário não existe!' });
    }

    // Verificar se a senha está correta
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
        return res.status(422).json({ msg: 'Senha inválida!' });
    }

    try {
        const secret = process.env.SECRET;
        const token = jwt.sign({ id: user._id }, secret);
        res.status(200).json({ msg: 'Autenticação realizada com sucesso!', token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente mais tarde!" });
    }
});

// Conexão com o banco de dados MongoDB
mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xxr7d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => {
        app.listen(3000, () => {
            console.log('Servidor rodando na porta 3000');
            console.log('Conectou ao banco!');
        });
    })
    .catch((err) => console.log('Erro na conexão com o banco:', err));