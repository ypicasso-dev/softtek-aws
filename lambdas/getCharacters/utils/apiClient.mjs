import axios from 'axios';

export const getId = (url) => {
    if (url.endsWith("/"))
        url = url.substring(0, url.length - 1);

    var partes = url.split('/');
    var id = partes[partes.length - 1];

    return id.toString();
};

export const callApisAndMerge = async () => {
    try {
        const [api1Response, api2Response] = await Promise.all([
            axios.get('https://swapi.info/api/people/'),
            axios.get('https://pokeapi.co/api/v2/pokemon?limit=100')
        ]);

        const dataFromApi1 = api1Response.data.map((m) => {
            return {
                "id": getId(m.url),
                "name": m.name,
                "gender": m.gender,
                "skinColor": m.skin_color,
                "eyeColor": m.eye_color,
                "hairColor": m.hair_color
            };
        });

        const dataFromApi2 = api2Response.data.results.map((m) => {
            let id = getId(m.url);

            return {
                "id": id,
                "pokemonId": id,
                "pokemonName": m.name,
                "pokemonImage": `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`
            };
        });

        // Crear un mapa para fusión más eficiente
        const api2Map = new Map();

        dataFromApi2.forEach(item => {
            api2Map.set(item.id, item);
        });

        // Fusionar datos basados en el ID común
        const mergedData = dataFromApi1.map((item1, index1) => {
            const matchingItem = api2Map.get(item1.id);

            return {
                ...item1,
                ...matchingItem
            };
        });

        return mergedData;
    } catch (error) {
        console.error('Error calling or merging APIs:', error);
        throw error;
    }
};