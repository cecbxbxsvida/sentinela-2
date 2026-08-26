const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARES
========================= */

app.use(cors());

app.use(express.json());

/*
    Localização da pasta frontend

    Estrutura esperada:

    projeto/
    ├── backend/
    │   ├── server.js
    │   └── db.json
    │
    └── frontend/
        ├── index.html
        ├── atendimento.html
        ├── triagem.html
        ├── medico.html
        └── css/
            └── index.css
*/

const FRONTEND_DIR = path.join(__dirname, "../frontend");

app.use(express.static(FRONTEND_DIR));


/* =========================
   BANCO DE DADOS
========================= */

const DB_FILE = path.join(__dirname, "db.json");


function readDB() {

    if (!fs.existsSync(DB_FILE)) {

        const databaseInicial = {
            usuarios: [
                {
                    usuario: "triagem",
                    senha: "123",
                    tipo: "triagem"
                },
                {
                    usuario: "medico",
                    senha: "123",
                    tipo: "medico"
                },
                {
                    usuario: "atendimento",
                    senha: "123",
                    tipo: "atendimento"
                }
            ],

            pacientes: [],

            triagens: [],

            consultas: []
        };

        writeDB(databaseInicial);

        return databaseInicial;
    }

    try {

        return JSON.parse(
            fs.readFileSync(DB_FILE, "utf8")
        );

    } catch (error) {

        console.error("Erro ao ler db.json:", error);

        return {
            usuarios: [],
            pacientes: [],
            triagens: [],
            consultas: []
        };
    }
}


function writeDB(data) {

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}


/* =========================
   PÁGINA INICIAL
========================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(FRONTEND_DIR, "index.html")
    );

});


/* =========================
   LOGIN
========================= */

app.post("/login", (req, res) => {

    console.log("Dados recebidos no login:", req.body);

    const { usuario, senha } = req.body;

    if (!usuario || !senha) {

        return res.status(400).json({
            erro: "Usuário e senha são obrigatórios."
        });

    }

    const db = readDB();

    const user = db.usuarios.find(
        u =>
            u.usuario === usuario &&
            u.senha === senha
    );


    if (!user) {

        return res.status(401).json({
            erro: "Usuário ou senha inválidos."
        });

    }


    console.log(
        `Login realizado: ${user.usuario} (${user.tipo})`
    );


    return res.status(200).json({

        usuario: user.usuario,

        tipo: user.tipo

    });

});


/* =========================
   ATENDIMENTO
========================= */

app.post("/atendimento", (req, res) => {

    const db = readDB();

    const paciente = {

        id: Date.now(),

        ...req.body,

        status: "triagem",

        createdAt: new Date().toISOString()

    };


    db.pacientes.push(paciente);

    writeDB(db);


    res.status(201).json(paciente);

});


/* =========================
   LISTAR PACIENTES
========================= */

app.get("/pacientes", (req, res) => {

    const db = readDB();

    res.json(db.pacientes);

});


/* =========================
   TRIAGEM
========================= */

app.post("/triagem", (req, res) => {

    const db = readDB();

    let risco = req.body.risco;


    /*
        Regra de temperatura

        Temperatura acima de 39:
        vermelho

        Temperatura abaixo de 38:
        amarelo

        Entre 38 e 39:
        mantém o risco enviado
    */

    const temperatura = Number(req.body.temperatura);


    if (!isNaN(temperatura)) {

        if (temperatura > 39) {

            risco = "vermelho";

        } else if (
            temperatura < 38 &&
            risco !== "vermelho"
        ) {

            risco = "amarelo";

        }

    }


    const triagem = {

        id: Date.now(),

        ...req.body,

        risco: risco || "verde",

        status: "aguardando_medico",

        createdAt: new Date().toISOString()

    };


    db.triagens.push(triagem);

    writeDB(db);


    res.status(201).json(triagem);

});


/* =========================
   LISTAR TRIAGENS
========================= */

app.get("/triagens", (req, res) => {

    const db = readDB();

    res.json(db.triagens);

});


/* =========================
   CONSULTA MÉDICA
========================= */

app.post("/consulta", (req, res) => {

    const db = readDB();

    const consulta = {

        id: Date.now(),

        ...req.body,

        createdAt: new Date().toISOString()

    };


    db.consultas.push(consulta);

    writeDB(db);


    res.status(201).json(consulta);

});


/* =========================
   LISTAR CONSULTAS
========================= */

app.get("/consultas", (req, res) => {

    const db = readDB();

    res.json(db.consultas);

});


/* =========================
   MEDICAÇÕES
========================= */

app.get("/medicacoes", (req, res) => {

    const db = readDB();

    res.json(db.consultas);

});


/* =========================
   TRATAMENTO DE ERROS
========================= */

app.use((err, req, res, next) => {

    console.error("Erro no servidor:", err);

    res.status(500).json({
        erro: "Erro interno do servidor."
    });

});


/* =========================
   INICIAR SERVIDOR
========================= */

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log(" Sistema Hospitalar iniciado");
    console.log("=================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("");
    console.log("Usuários disponíveis:");
    console.log("triagem     / 123");
    console.log("medico      / 123");
    console.log("atendimento / 123");
    console.log("");

});


module.exports = app;
