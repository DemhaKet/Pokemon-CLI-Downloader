import inquirer from 'inquirer'
import fs from 'fs'

console.log('======= POKEMON DOWNLOADER =======')

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


async function ask() {
    const prompt = await inquirer.prompt(selection)
    return prompt 
}

let pokemonObject = await ask()
let spritesUrl = []
let artworkUrl = ''
let stats = []
let dir = ''

async function fetchData() {
    dir =  `${pokemonObject['Pokemon name']}`
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonObject['Pokemon name']}`)
    const json = await response.json()
    fs.mkdir(dir, (err) => {
        if (err) {
            console.log(err)
        }
    })

    if (Object.values(pokemonObject)[1].includes('Artwork')) {
        artworkUrl = json.sprites.other['official-artwork'].front_default
        console.log(artworkUrl)
        await getArtwork()
    } 

    if (Object.values(pokemonObject)[1].includes('Sprites')) {
        for (const key in json.sprites) {
            if (key === 'other' || key === 'versions') {
                continue
            } else {
                let spriteKey = key
                let spriteValue = json.sprites[key]
                let sprite = {[spriteKey]: spriteValue}
                if (spriteValue === null) {
                    continue
                } else {
                    spritesUrl.push(sprite)
                }
                // console.log(spritesUrl)
            }
        }
        await getSprites()
        spritesUrl = []
    }

    if (Object.values(pokemonObject)[1].includes('Stats')) {
        for (const key in json.stats) {
            let stat = {}
            let statName = json.stats[key].stat.name
            let baseStat = json.stats[key].base_stat
            stat[statName] = baseStat
            stats.push(`${Object.keys(stat)}: ${Object.values(stat)}`)
            // console.log(stats)
        }
        await writeStats()
        stats = []
    }
}

// fetchData()


async function getArtwork() {
    const response = await fetch(artworkUrl)
    const image = await response.arrayBuffer()
    const buffer = Buffer.from(image)

    fs.writeFile(`${dir}/Artwork.png`, buffer, (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log('Created: Artwork.png')
        }
    })
}


// some values are null for certain pokemons. need to implement handle that
async function getSprites() {
    for (let i = 0; i < spritesUrl.length; i++) {
        const response = await fetch(Object.values(spritesUrl[i]))
        const image = await response.arrayBuffer()
        const buffer = Buffer.from(image)
        const imageName = `${Object.keys(spritesUrl[i])}.png`
        // console.log(spritesUrl)
        
        fs.writeFile(`${dir}/${imageName}`, buffer, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log(`Created: ${imageName}`)
            }
        })
    }

}

async function writeStats() {
    let all = stats.join('\n')
    
    fs.writeFile(`./${dir}/stats.txt`, all, (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log('Created stats.txt')
        }
    })
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

}

main()
