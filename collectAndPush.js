const TB = require('thingsboard_api')
const config = require('dotenv').config();
main()
async function main() {
    var statesTB = await TB.get.allObjectsIDandKeysByType('State', 'asset', 'stateName,codeState');
    states = {}
    for (let i=0; i<statesTB.length; i++){
        if(typeof statesTB[i].stateName != 'undefined')
            states[statesTB[i].stateName] = {codeState: statesTB[i].codeState, stateName:statesTB[i].stateName, name: statesTB[i].name}
        else
            states[statesTB[i].codeState] = {codeState: statesTB[i].codeState, stateName:statesTB[i].name, name: statesTB[i].name}
    }
    console.log(states)
}

function stateChange(stateName,attrs,telemetry,idMachine){
    if(typeof machineData[idMachine].universalState != 'undefined')
        telemetry.universalStateOld = machineData[idMachine].universalState

    machineData[idMachine].universalState = states[stateName].codeState
    telemetry.universalStateNew = states[stateName].codeState
    for(let key in states){
        if(key == stateName)
            telemetry[key] = 1
        else
            telemetry[key] = 0
    }
    return {attrs: attrs, telemetry: telemetry}
}

async function collectParseData(data){
    for(let id in data){
        let attrs = {}
        let telemetry = {}
        for(let key in data[id]) {
            let value = data[id][key]
            switch (key) {
                case "input": //Меняем значения и создаём под это телеметрию только при изменении состояния, или при первом запуске
                    if(value[0] === 3 && (typeof machineData[id].universalState == 'undefined' || machineData[id].universalState !== states['work'].codeState)) {
                        let afterChange = stateChange('work',attrs,telemetry, id)
                        attrs = afterChange.attrs
                        telemetry = afterChange.telemetry
                    }else if (value[0] !== 3 && (typeof machineData[id].universalState == 'undefined' || machineData[id].universalState !== states['down'].codeState)){
                        let afterChange = stateChange('down',attrs,telemetry,id)
                        attrs = afterChange.attrs
                        telemetry = afterChange.telemetry
                    }


                    //Нужно только на этапе дебага
                    if(typeof machineData[id].inputStr == 'undefined' || machineData[id].inputStr !== value.toString().replace(',','_'))
                    {
                        telemetry.input0 = value[0]
                        telemetry.input1 = value[1]
                        attrs.input = value.toString().replace(',','_')
                        machineData[id].inputStr = value.toString().replace(',','_')
                    }
                    break
                case "output":
                    if(typeof machineData[id].outputStr == 'undefined' || machineData[id].outputStr != value.toString().replace(',','_'))
                    {
                        telemetry.output0 = value[0]
                        telemetry.output1 = value[1]
                        attrs.output = value.toString().replace(',','_')
                        machineData[id].outputStr = value.toString().replace(',','_')
                    }
                    break
                case 'la':
                    telemetry.w1 = data[id][key]
                    break
                case 'lb':
                    telemetry.w2 = data[id][key]
                    break
                case 'lc':
                    telemetry.w3 = data[id][key]
                    break
            }
        }
        await pushData(data[id].name,attrs,telemetry)

        async function pushData(name, attrs, telemetry){
            try{
                let push = await TB.push.pushAttributes(null,'device',attrs,telemetry,null,null,null,data[id].deviceID)
            }catch (e) {
               await pushData(name, attrs, telemetry)
            }
        }
    }
}

module.exports = {
    collectParseData: collectParseData
}