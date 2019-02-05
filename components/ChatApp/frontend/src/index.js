import './env.js'
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ChatApp from './ChatApp';
import * as serviceWorker from './serviceWorker';

// Ensure window.env exists.  This is where the serverless framework stores env vars.
window.env = window.env || {}

ReactDOM.render(<ChatApp />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
