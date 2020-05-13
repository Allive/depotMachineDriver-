const TB = require('thingsboard_api');
const config = require('dotenv').config();
main().then();
async function main() {
    var statesTB = await TB.get.allObjectsIDandKeysByType('State', 'asset', 'stateName,codeState');
    states = {};
    for (let i=0; i<statesTB.length; i++){
        if(typeof statesTB[i].stateName != 'undefined')
            states[statesTB[i].stateName] = {codeState: statesTB[i].codeState, stateName:statesTB[i].stateName, name: statesTB[i].name};
        else
            states[statesTB[i].codeState] = {codeState: statesTB[i].codeState, stateName:statesTB[i].name, name: statesTB[i].name}
    }
}


function checkState(machineID,input,output,telemetry){
    let nowState;
/*
    INPUT
    X0.0 ,0.4 Вниз (для Комплекта тепловозных домкратов)	['00010001']    [17]
    X0.2 ,0.6 Вверх (для Комплекта тепловозных домкратов)	['01000010']    [66]
    X0.0 Включено (для ТЭД и Станка обточки колёсных пар) 	['00000001]	    [1]

    OUTPUT
    Y0.0 Работа 	['00000001]	                                            [1] //DONE
 */
    if(typeof input == 'undefined')
        input = [];
    if(typeof output == 'undefined')
        output = [];

    //Здесь анализ состояния
    if(input[0] === 3 || output[0] === 1 || input[0] === 1)
        nowState = states['work'].codeState;
    else
        nowState = states['down'].codeState;

    //Если ничего не поменялось - ничего и не трогаем, возвращаем прошлую телеметрию
    if(machineData[machineID].universalState === nowState)
        return telemetry;

    telemetry.universalStateOld = machineData[machineID].universalState;
    telemetry.universalStateNew = nowState;
    machineData[machineID].universalState = nowState;

    //Устанавливаем все остальные состояния в нули для временных диаграмм
    for(let key in states){
        telemetry[key] = states[key].codeState === nowState ? 1: 0
    }

    //Сбрасываем инфу в глобальной переменной, I/O приходят не всегда
    machineData[machineID].output = []
    machineData[machineID].input = []
    return telemetry
}


async function collectParseData(data){
    for(let id in data){
        let attrs = {};
        let telemetry = {};
        for(let key in data[id]) {
            let value = data[id][key];
            switch (key) {

                case "input":
                    //Нужно только на этапе дебага
                    if((typeof machineData[id].inputStr == 'undefined' || machineData[id].inputStr !== value.toString()) && value.length !== 0)
                    {
                        console.log({
                            ts: new Date().toLocaleString(),
                            name:machineData[id].name,
                            input:value
                        });
                        telemetry.input0 = value[0];
                        telemetry.input1 = value[1];
                        machineData[id].inputStr = value.toString()
                    }
                    telemetry.input = value.toString()
                    break;
                case "output":
                    //Нужно только на этапе дебага
                    if((typeof machineData[id].outputStr == 'undefined' || machineData[id].outputStr !== value.toString()) && value.length !==0)
                    {
                        console.log({
                            ts: new Date().toLocaleString(),
                            name:machineData[id].name,
                            output:value
                        });
                        telemetry.output0 = value[0];
                        telemetry.output1 = value[1];
                        machineData[id].outputStr = value.toString()
                    }
                    telemetry.output = value.toString()
                    break;
                case 'la':
                    telemetry.w1 = data[id][key];
                    break;
                case 'lb':
                    telemetry.w2 = data[id][key];
                    break;
                case 'lc':
                    telemetry.w3 = data[id][key];
                    break
            }
        }
        //Идём проверять, какое сейчас состояние, заодно берем новую телеметрию (или нет, если ничего не изменилось)
        telemetry =  checkState(id,data[id].input, data[id].output,telemetry)
        let ts = new Date().getTime()
        pushData(data[id].name,attrs,telemetry, ts);

        async function pushData(name, attrs, telemetry, ts){
            try{
                await TB.push.pushAttributes(null,'device',attrs,telemetry,ts,null,null,data[id].deviceID)
            }catch (e) {
               await pushData(name, attrs, telemetry, ts)
            }
        }
    }
}

module.exports = {
    collectParseData: collectParseData
};