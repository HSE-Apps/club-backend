const express = require('express')
const jwt = require('jsonwebtoken')
const e = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()

const AUTH_API = process.env.AUTH_API


module.exports = (options) => {
    return async (req, res, next) => {

        if(!req.headers.authorization){

            return res.status(401).json({'error': [{"msg": "Missing authentication token"}]})

        } else {

            try{
                const response = await axios.get(`${AUTH_API}/user`, {headers: {authorization: req.headers.authorization}})
                const user = response.data

                if(!options){
                    res.locals.requester = user
                    next()
                } else {
                    if(options.authLevel == "teacher"){
                        if(user.role != 'teacher'){
                            return res.status(401).json({'error': [{"msg": "You must be a teacher"}]})
                        } else {
                            res.locals.requester = user
                            next()
                        }
                    }
                }

            } catch (err) {
                
                console.log(err.response.data)
                return res.status(500).json({'error': [{"msg": "Server Error"}]})

            }
        }
        
    }
}