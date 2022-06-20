
import './App.css';
import Temp from './components/Temp';
import Dist from './components/Dist';
import Humid from './components/Hmid';

//import Map from './map/map';
import Reset from './controls/reset';
import React from 'react';
import Start from './map/start'
/*import { Layout } from 'antd';
const { Header, Footer, Sider, Content } = Layout;*/

const App = ()=> {
  return (
    <div className="App">     
      <div className="Components">
        <div className="Map">
          <Start />
        </div>
        <div className="Dashboard">
          <Temp />
          <Humid />
          <Dist />
          <Reset />
        </div>

      </div>
    </div>
  );
}



export default App;
