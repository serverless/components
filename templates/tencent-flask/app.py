# -*- coding: utf8 -*-

import json
from flask import Flask, jsonify, request
app = Flask(__name__)


@app.route("/")
def index():
    return "Hello Flask"

@app.route('/user', methods = ['POST'])
def addUser():
    # we must get request body from clound function event;
    event = request.environ['event']
    user = json.loads(event['body'])
    return jsonify(data=user)


@app.route("/user", methods = ['GET'])
def listUser():
    users = [{'name': 'test1'}, {'name': 'test2'}]
    return jsonify(data=users)


@app.route("/user/<id>", methods = ['GET'])
def getUser(id):
    return jsonify(data={'name': 'test1'})
