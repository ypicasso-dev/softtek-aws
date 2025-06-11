// service/index.js
const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');

const app = express();
const port = 3000;

let tokenCache = {};

// Configuración de Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Mi API Node.js 20',
            version: '1.0.0',
            description: 'Documentación de mi servicio local',
            contact: {
                name: 'Yoel Picasso',
                email: 'ypicasso@gmail.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        './service/*.js',
    ], // Archivos donde tienes tus rutas
};


const specs = swaggerJsdoc(options);

let client;

// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover('https://cognito-idp.us-east-2.amazonaws.com/us-east-2_A5j6Z4pFt');

    client = new issuer.Client({
        client_id: '6lbchkua2u7c15l804lsa573v6',
        client_secret: '1ond15gfrdhk51mal91dvvf1a931bf6glb4jcblbnksigmptl5v9',
        redirect_uris: ['http://localhost:3000/callback'],
        response_types: ['code']
    });
};

initializeClient().catch(console.error);

const checkAuth = async (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }

    next();
};

app.use(express.json());

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, { explorer: true })
);

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: 'lax' }
}));


const api_id = "d6oylxsxbc";
const region = "us-east-2";

const invoke = async (req, res, method, endpoint, data) => {
    const url = `https://${api_id}.execute-api.${region}.amazonaws.com/${endpoint}`;
    const token = tokenCache?.id_token;

    let response = null;

    try {
        response = await axios({
            method: method,
            url: url,
            data: data,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.log("AXIOS ERROR: ", error.response.status);
        console.log("AXIOS ERROR: ", error.response.statusText);

        let statusCode = error.response.status;
        let statusText = error.response.statusText;

        res.status(statusCode).send({
            statusText: statusText,
            message: `Desde un navegador vaya a http://${req.hostname}:${port}/login`,
            user: "ypicasso@gmail.com",
            pass: "Softtek1982$"
        });
    }

    return response?.data;
};

function getPathFromURL(urlString) {
    try {
        const url = new URL(urlString);
        return url.pathname;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

app.get(getPathFromURL('http://localhost:3000/callback'), async (req, res) => {
    try {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            //'https://d84l1y8p4kdic.cloudfront.net',
            'http://localhost:3000/callback',
            params,
            {
                nonce: req.session.nonce,
                state: req.session.state
            }
        );

        const userInfo = await client.userinfo(tokenSet.access_token);

        req.session.userInfo = userInfo;
        req.session.id_token = tokenSet.id_token;//access_token, refresh_token

        tokenCache = { ...tokenSet };

        res.redirect('/');
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('/');
    }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Obtiene el listado de los endpoints que ofrece el servicio
 *     tags: [Endpoints]
 *     responses:
 *       200:
 *         description: Endpoints del servicio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *       500:
 *         description: Error del servidor
 */
app.get("/", checkAuth, async (req, res) => {
    res.send({
        'req.isAuthenticated: ': req.isAuthenticated,
        'req.session.userInfo: ': req.session.userInfo ?? null,
        "getCharacters": { "method": "GET" },
        "saveCharacter": { "method": "POST", "body": "{id, name, pokemon_id}" },
        "getHistory": { "method": "GET" },
    })
});

app.get('/login', (req, res) => {
    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        scope: 'email openid phone',
        state: state,
        nonce: nonce,
    });

    res.redirect(authUrl);
});

/**
 * @swagger
 * /getCharacters:
 *   get:
 *     summary: Obtiene tiene los personajes fusionados de Star Wars con su acompañante Pokemón
 *     tags: [Character]
 *     responses:
 *       200:
 *         description: Lista de personajes de Star Wars
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/character'
 *       500:
 *         description: Error del servidor
 */
app.get('/getCharacters', checkAuth, async (req, res) => {
    const result = await invoke(req, res, 'GET', `getCharacters`);
    res.send(result);
});

/**
 * @swagger
 * /saveCharacter:
 *   get:
 *     summary: Obtiene tiene los personajes registrados en el historial
 *     tags: [Character]
 *     responses:
 *       200:
 *         description: Lista de personajes de Star Wars dentro del historial
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/character' 
 *       500:
 *         description: Error del servidor
 */
app.post('/saveCharacter', checkAuth, async (req, res) => {
    const result = await invoke(req, res, 'POST', `saveCharacter`, req.body);
    res.send(result);
});

/**
 * @swagger
 * /getHistory:
 *   get:
 *     summary: Obtiene tiene los personajes registrados en el historial
 *     tags: [Character]
 *     responses:
 *       200:
 *         description: Lista de personajes de Star Wars dentro del historial
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/character'
 *       500:
 *         description: Error del servidor
 */
app.get('/getHistory', checkAuth, async (req, res) => {
    const result = await invoke(req, res, 'GET', `getHistory`);
    res.send(result);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     character:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: ID del personaje
 *         name:
 *           type: string
 *           description: Nombre del personaje
 *         gender:
 *           type: string
 *           description: Género del personaje
 *         skinColor:
 *           type: string
 *           description: Color de piel
 *         eyeColor:
 *           type: string
 *           description: Color de ojos
 *         hairColor:
 *           type: string
 *           description: Color de cabello
 *         pokemonId:
 *           type: string
 *           description: ID de Pokemón
 *         pokemonName:
 *           type: string
 *           description: Nombre de Pokemón
 *         pokemonImage:
 *           type: string
 *           description: URL de imagen Pókemon
 *       example:
 *           id: '79'
 *           name: 'Chuwbaka'
 *           gender: 'Wookie'
 *           skinColor: 'Brown'
 *           eyeColor: 'Black'
 *           hairColor: 'Brown'
 *           pokemonId: '79'
 *           pokemonName: 'Gizmo'
 *           pokemonImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/79.svg'
 */

app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log(`Documentación Swagger en http://localhost:${port}/api-docs`);
});

//node service/index.js
//npx nodemon service/index.js