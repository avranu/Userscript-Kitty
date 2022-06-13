import React from 'react';
import Button from '@mui/material/Button';
import './styles/index.css';
import App from './components/App';
import Buttons from './components/Buttons';
import Notifications from './components/Notifications';
import reportWebVitals from './reportWebVitals';
import ReactTemplate from './ReactTemplate';
import Notify from './Notify';
import {Registry} from './DomElements';
import Userscript from './Userscript';
import Page from './Pages';

//TODO
if (typeof jQuery === "undefined") {
  console.log("jQuery undefined. Loading it");
    let script = document.createElement('script');
    script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    let head = document.getElementsByTagName('head')[0];
}

const $ = jQuery;

let selectors = new Registry({
  'name of selector': "body div.someClassName",
});

export default class Example_Script extends Userscript {
  /**
   * @returns {void} nothing
   */
  init(): void {
    this.page = new Page({ selectors: selectors, auto: this.auto });
  }
}

try {
  /** jQuery ready */
  $(function () {
    /** Scheduler ready */
    let userscript = new Example_Script();
    userscript.ready().then(() => {
      Notify.log("Example Userscript is ready");
    }).catch(err => {
      Notify.error("Example userscript did not ready.", err);
    });
  });

} catch (err) {
  Notify.error("Error halted execution: ", err);
}