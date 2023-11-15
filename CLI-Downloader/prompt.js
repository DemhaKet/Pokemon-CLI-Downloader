import inquirer from 'inquirer'
import fs from 'fs/promises'

console.log(`\n======= POKEMON DOWNLOADER ======= \n`)

const selection = [
    {
        type: 'input', 
        name: 'Pokemon name', 
        message: 'Pokemon name:', 
    }, 
    {
        type: 'checkbox', 
        name: 'Pokemon Info', 
        message: 'Pokemon info to download',
        choices: ['Artwork', 'Stats', 'Sprites']
    }, 
    {
        type: 'confirm', 
        name: 'Continue?', 
        message: 'Would you like to search for another pokemon?'
    }
]

// Prompts user  
async function ask() {
    const prompt = await inquirer.prompt(selection)
    return prompt 
}

let pokemonObject = await ask()
const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonObject['Pokemon name']}`)
const json = await response.json()
let spritesUrl = []
let artworkUrl = ''
let stats = []
let dir = ''


// Checks if the directory exists, if not creates it
async function mkdir() {
    dir = `${pokemonObject['Pokemon name']}`

    try {
        await fs.access(`${dir}`)
    } catch {
        fs.mkdir(dir, (err) => {
            if (err) {
                console.log(err)
            }
        })
    }
}

// Dynamically assigns the artwork url and calls fetchArtwork()
async function artworkAll() {
    if (Object.values(pokemonObject)[1].includes('Artwork')) {
        artworkUrl = json.sprites.other['official-artwork'].front_default
        await fetchArtwork()
    } 
}

// Fetches the Artwork
async function fetchArtwork() {
    const response = await fetch(artworkUrl)
    const image = await response.arrayBuffer()
    const buffer = Buffer.from(image)
    
    try {
        await fs.writeFile(`${dir}/Artwork.png`, buffer)
        console.log('Created: Artwork.png')
    } catch (err) {
        console.log(err)
    }
    
}

// Dynamically populates the stats array and calls fetchStats()
async function statsAll() {
    if (Object.values(pokemonObject)[1].includes('Stats')) {
        for (const key in json.stats) {
            let statName = json.stats[key].stat.name
            let baseStat = json.stats[key].base_stat
            stats.push(`${statName}: ${baseStat}`)
        }

        await fetchStats()
        stats = []

    }
}

// Fetches the Stats
async function fetchStats() {
    let all = stats.join('\n')
    try {
        await fs.writeFile(`./${dir}/stats.txt`, all)
        console.log('Created stats.txt')
    } catch (err) {
        console.log(err)
    }
}

// Dynamically populates the spritesUrl array and calls fetchSprites()
async function spritesAll() {
    if (Object.values(pokemonObject)[1].includes('Sprites')) {
        for (const key in json.sprites) {
            if (key === 'other' || key === 'versions') continue
            let spriteKey = key
            let spriteValue = json.sprites[key] 
            
            if (!spriteValue) continue // For some pokemons, some values are null
            let sprite = {[spriteKey]: spriteValue}
            spritesUrl.push(sprite)   
        }

        await fetchSprites()
        spritesUrl = []

    }
}

// Fetches the Sprites using Promise.all() to excute code asynchronously 
async function fetchSprites() {
    const spritesPromises = spritesUrl.map(async (sprite) => {
        const response = await fetch(Object.values(sprite)[0])
        const image = await response.arrayBuffer()
        const buffer = Buffer.from(image)
        const imageName = `${Object.keys(sprite)[0]}.png`
        
        try {
            await fs.writeFile(`${dir}/${imageName}`, buffer)
            console.log(`Created: ${imageName}`)
        } catch (err) {
            console.log(err)
        }
    })
    
    await Promise.all(spritesPromises)

}

async function fetchData() {
    await mkdir()
    await artworkAll()
    await spritesAll()
    await statsAll()    
}

async function main() {
    while (pokemonObject['Continue?'] === true) {
        await fetchData(); 
        pokemonObject = await ask(); 
        
        if (pokemonObject['Continue?'] === false) {
            break;
        }
    }
    
    await fetchData()    
    console.log(`\n======= POKEMON DOWNLOADER =======\n`)

}

main()
