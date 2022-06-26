import React,{useState,useEffect} from 'react'
import axios from 'axios'
import './map.css'
import {Chart as ChartJS, CategoryScale, LinearScale, ScatterController, Title, Tooltip, Legend, PointElement, LineElement,} from 'chart.js'
import {Scatter} from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { saveAs } from 'file-saver'; 
import _ from 'underscore';


ChartJS.register(
    CategoryScale, LinearScale, ScatterController, Title, Tooltip, Legend, PointElement, LineElement,ChartDataLabels
)


const Map = ({Pos, roverclear}) => {
    const [alienInfo, setalienInfo] = useState([])
    const [roverInfo, setroverInfo] = useState([])
    const [ScatterData, setScatterData]= useState({datasets:[]})
    const [ScatterOptions, setScatterOptions]=useState({})
    const [dataObstacle, setdataObstacle]=useState([])
    const [dataAlien, setdataAlien]=useState([])
    const [colorAlien, setcolorAlien]=useState([])
    const [sizeAlien, setsizeAlien]=useState([])
    const [sizeBuilding, setsizeBuilding]=useState([])
    const [dataBuilding, setdataBuilding]=useState([])
    const [dataFan, setdataFan]=useState([])
    const [dataRover, setdataRover]=useState([{"x":0,"y":0}])
    const [angleRover, setAngleRover]=useState(-90)
    const [minmaxX, setminmaxX] = useState([-150, 150])
    const [minmaxY, setminmaxY] = useState([-150, 150])
    const [clearRover, setclearRover]=useState(0)

    useEffect(()=>{
        setclearRover(roverclear)
    }, [roverclear])

    useEffect(() => {
        if(Pos===0){
            setdataRover([{"x":0,"y":0}]);
            setAngleRover(-90);
            setminmaxX([-150,150])
            setminmaxY([-150,150])
        }
        else if(Pos===1){
            setdataRover([{"x":0,"y":0}])
            setminmaxX([-300,0])
            setminmaxY([0, 300])
        }
        else if(Pos===2){
            setdataRover([{"x":0,"y":0}])
            setminmaxX([0, 300])
            setminmaxY([0, 300])
        }
        else if(Pos===3){
            setdataRover([{"x":0,"y":0}])
            setminmaxX([0, 300])
            setminmaxY([0, 300])
        }
        else if(Pos===4){
            setdataRover([{"x":0,"y":0}])
            setminmaxX([-300, 0])
            setminmaxY([0, 300])
        }
    }, [Pos])
    

    useEffect(() => {
        const fetchData = async ()=>{
            try {
                const res = await axios.get('http://localhost:5000/data/location')
                setroverInfo(res.data)
               // console.log(res.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchData()
        const interval=setInterval(()=>{
            fetchData()
           },500)
             
             
           return()=>clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchData = async ()=>{
            try {
                const res = await axios.get('http://localhost:5000/data/aliens')
                setalienInfo(res.data)
               // console.log(res.data)
            } catch (error) {
                console.log(error)
            } 
        }
        fetchData()
        const interval=setInterval(()=>{
            fetchData()
           },100)
           return()=>clearInterval(interval)
    }, [])
    
    useEffect(()=>{
       // alienInfo?.map((obstacle, index)=>{
        if(alienInfo.length===0){
            setdataObstacle([])
            setcolorAlien([])
            setsizeAlien([])
            setsizeBuilding([])
            //return; DONT RETURN D:
        }
        if(alienInfo[0]){
            if(dataObstacle.some(item => (/*obstacle.Location.x*/alienInfo[0].Location.x < item.x+5) && (item.x-5 < alienInfo[0].Location.x/*obstacle.Location.x*/) && (/*obstacle.Location.y*/alienInfo[0].Location.y < item.y+5) && (item.y-5 < /*obstacle.Location.y*/alienInfo[0].Location.y))){
                //console.log("COLOURS: "+colorAlien)
            }
            
            else{
                setdataObstacle(prevdataObstacle=>[...prevdataObstacle, alienInfo[0].Location])
                if(alienInfo[0].type === "alien"){
                    setdataAlien(prevaliens=>[...prevaliens, /*obstacle.Location*/alienInfo[0].Location])
                    setcolorAlien(prevcolalien=>[...prevcolalien, /*obstacle.Colour*/alienInfo[0].Colour])
                    setsizeAlien(prevsizealien=>[...prevsizealien, alienInfo[0].size])
                    //console.log(colorAlien)
                }
                else if(alienInfo[0].type === "building"){
                    setdataBuilding(prevbuildings=>[...prevbuildings, /*obstacle.Location*/alienInfo[0].Location])
                    setsizeBuilding(prevsizebuild=>[...prevsizebuild, alienInfo[0].size])
                }
                else if(alienInfo[0].type === "fan"){
                    setdataFan(prevfans=>[...prevfans, /*obstacle.Location*/alienInfo[0].Location])
                }
                //return;
            }
        }

        if(roverInfo[0]){
            
            if(clearRover===1){
                setdataRover([{"x":roverInfo[0].Location.x, "y":roverInfo[0].Location.y}])
                setclearRover(0)
            }  
            else if(((roverInfo[0].Location.x !== dataRover[dataRover.length-1]["x"]) || (roverInfo[0].Location.y !== dataRover[dataRover.length-1]["y"]))){
            setdataRover(prevdataRover=>[...prevdataRover, {"x":roverInfo[0].Location.x, "y":roverInfo[0].Location.y}])
            }
            setAngleRover(-roverInfo[0].angle)
                //console.log("Setting angle to "+angleRover)
        }
        if(roverInfo.length===0){
            setdataRover([{"x":0,"y":0}]);
            setAngleRover(-90);
        }
            
       // console.log("dataRover"+dataRover)

        setScatterData({
            datasets:[
                {
                    label:"Rover-Movement",
                    data: dataRover,
                    borderColor: "rgb(255,162,0)",
                    backgroundColor: "rgba(255,162,0,0.4)",
                    showLine:true,
                    pointRadius: 0.1,
                    pointStyle: 'line',
                    datalabels:{
                        font: {
                            size: 35
                        },
                        color:"black",
                        formatter: function(value) {
                            return '➤'
                        },
                        rotation: function(ctx) {
                            return angleRover
                        },
                        display: function(context){
                            return (context.dataIndex === context.dataset.data.length - 1);
                        }
                    }
                },
                {
                
                    label:"Alien Sighting",
                    data: dataAlien,
                    backgroundColor: function(context){
                        var index = context.dataIndex;
                        return colorAlien[index];
                    },
                    borderColor:"black",
                    pointRadius:function(context){
                        var index = context.dataIndex;
                        return sizeAlien[index]*1.5;
                    },
                    datalabels:{
                        anchor:"top",
                        align: "end"
                    }
                    
                },
                {
                
                    label:"Building Sighting",
                    data: dataBuilding,
                    borderColor: "rgb(0,0,0)",
                    backgroundColor: "cyan",
                    pointStyle: 'rect',
                    pointRadius:function(context){
                        var index = context.dataIndex;
                        return sizeBuilding[index]*1.5;
                    },
                    datalabels:{
                        anchor:"top",
                        align: "end",
                    }
                    
                },
                {
                
                    label:"Fan",
                    data: dataFan,
                    borderColor: "rgb(0,0,0)",
                    backgroundColor: "brown",
                    pointStyle: 'triangle',
                    pointRadius:10,
                    datalabels:{
                            anchor:"top",
                            align: "end"
                    }
                }
            ]
        })

        setScatterOptions({
            scales:{
                y:{
                    min: minmaxY[0],
                    max: minmaxY[1],
                    ticks:{
                        stepSize: 10,
                        autoSkip:false
                    },
                    grid:{
                        color:"grey"
                    }
                },
                x:{
                    min: minmaxX[0],
                    max: minmaxX[1],
                    ticks:{
                        autoSkip:false,
                        stepSize: 10,
                    },
                    grid:{
                        color:"grey"
                    }
                },
            },
            aspectRatio: 1,
            animation: {
                duration: 0
            },
            
            responsive: true,
            maintainAspectRatio:true,
            plugins: {
                legend:{
                    
                    labels:{
                        usePointStyle: true,
                        font:{
                            size: 15,
                            style: "oblique",
                            weight: "bold"
                        }
                    }
                },
                title: {
                    display:false,
                    text:"Mars Map",
                    font:{
                        size:20
                    }
                },
                
            }
        })
    },[alienInfo, roverInfo])
//<canvas role="img" height="1419" width="1420" style="box-sizing: border-box; display: block; height: 1513.6px; width: 1514.67px;"></canvas>
    const download = () => {
        const canvasSave = document.getElementById('chart');
        canvasSave.toBlob(function (blob) {
            saveAs(blob, "map.png")
        })
    }

    /*useEffect(()=>{
        if(clearRover===1){
            setdataRover({"x":roverInfo[0].Location.x, "y":roverInfo[0].Location.y})
            setclearRover(0)
            return;
        }  
    },[clearRover])*/

    return (
        <div className={Pos!==0?'map':'hide'}>
            <div id="lol">
                <button  className='downloadbutt' onClick={download}>Download map as PNG</button>
                <div id='canvas'>
                <Scatter id='chart' options={ScatterOptions} data={ScatterData} />
                </div>
            </div>
        </div>
    )
}
export default Map