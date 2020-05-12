const TB = require('thingsboard_api')
const config = require('dotenv').config();
async function main(){
    let options = {
        TB_HOST: config.parsed.TB_HOST,
        TB_PORT: config.parsed.TB_PORT,
        TB_USERNAME: config.parsed.TB_USERNAME,
        TB_PASSWORD: config.parsed.TB_PASSWORD,
    }

    await TB.createConnection(options);
    var allStates = await TB.get.allObjectsIDandKeysByType('State','asset','codeState,Type')
    var allCategoryStates = await TB.get.allObjectsIDandKeysByType('stateCategory','asset','codeStateCategory')
    var allWorkshops = await TB.get.allObjectsIDbyType('workshop','asset')
    var allFactories = await TB.get.allObjectsIDbyType('factory','asset')
    var allSections = await TB.get.allObjectsIDbyType('section','asset')
    var allMachines = await TB.get.allObjectsIDbyType('machine','device')

    var allArray = []
    var allKeys = []

    function pushKeys(object){
        for(let i=0;i< object.length;i++){
            for(let key in object[i]){
                if(!allKeys.includes(key) && key!='id')
                    allKeys.push(key)
            }
        }
    }
    pushKeys(allStates)
    pushKeys(allCategoryStates)
    pushKeys(allWorkshops)
    pushKeys(allFactories)
    pushKeys(allStates)
    pushKeys(allSections)
    pushKeys(allMachines)

    allArray.push(allKeys)

    pushArray(allStates)
    pushArray(allCategoryStates)
    pushArray(allWorkshops)
    pushArray(allFactories)
    pushArray(allStates)
    pushArray(allSections)
    pushArray(allMachines)




    function pushArray(object){
        for(let i=0;i<object.length;i++) {
            let element = []
            for (let ii = 0; ii < allKeys.length; ii++) {
                if(typeof object[i][allKeys[ii]] !='undefined')
                    element.push(object[i][allKeys[ii]])
                else
                    element.push("")
            }
            allArray.push(element)
        }
    }

    var csvContent = "data:text/csv;charset=utf-8,";

    allArray.forEach(function(rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });

    console.log(1)







}



main()