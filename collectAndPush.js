const TB = require('thingsboard_api')
const config = require('dotenv').config();

async function collectParseData(data){
    console.log('input')
    for(let id in data){
        let attrs = {}
        let telemetry = {}
        for(let key in data[id]) {
            let value = data[id][key]
            let element = data[id]
            switch (key) {
                case "input":
                    if(value[0] == 3 && (typeof machineData[id].universalState == 'undefined' || machineData[id].universalState != 5)) {
                        if(typeof machineData[id].universalState != 'undefined')
                            attrs.universalStateOld = machineData[id].universalState
                        machineData[id].universalState = 5
                        attrs.universalState = machineData[id].universalState
                        telemetry['Работает'] = 1
                        telemetry['Простой'] = 0
                        telemetry['Выключен'] = 0
                        telemetry['Прочее'] = 0

                    }else if (value[0] != 3 && (typeof machineData[id].universalState == 'undefined' || machineData[id].universalState != 0)){
                        if(typeof machineData[id].universalState != 'undefined')
                            attrs.universalStateOld = machineData[id].universalState
                        machineData[id].universalState = 0
                        attrs.universalState = machineData[id].universalState

                        telemetry['Работает'] = 0
                        telemetry['Простой'] = 1
                        telemetry['Выключен'] = 0
                        telemetry['Прочее'] = 1
                    }

                    if(typeof machineData[id].inputStr == 'undefined' || machineData[id].inputStr != value.toString().replace(',','_'))
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