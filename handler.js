'use strict';

const twilioAccountSid = process.env.TWILIOID
const twilioAccountKey = process.env.TWILIOKEY
const twilioPhoneNumber = process.env.TWILIONUMBER
const recaptchaSecret = process.env.RECAPTCHAKEY

const request = require('request')
const twilioClient = require('twilio')(twilioAccountSid,twilioAccountKey)

const headers = {'Access-Control-Allow-Origin':"*"}

module.exports.validateAndSend = (event,context,callback)=>{
  const validationData = {
    url:'https://www.google.com/recaptcha/api/siteverify?secret='+recaptchaSecret+"&response="+event.body.captcha,
    method:'POST',
  };

  request(validationData,function(error,response,body){
    const parsedBody = JSON.parse(body)
    if(error||response.statusCode!==200){
      const recaptchaErrResponse = {
        headers:headers,
        statusCode:500,
        body:JSON.stringify({
          status:'fail',
          message:'Error attempting to validate recaptcha',
          error:error|| response.statusCode
        })
      }
      return callback(null,recaptchaErrResponse)
    } else if (parsedBody.success === false){
      const recaptchaFailedErrResponse = {
        headers:headers,
        statusCode:200,
        body:JSON.stringify({
          status:'fail',
          message:'Captcha validation failed',
        })
      }
      return callback(null,recaptchaFailedErrResponse)
    } else if(parsedBody.success === true){
      const sms = {
        to: event.body.to,
        body:event.body.message ||'',
        from: twilioPhoneNumber,
      }
      twilioClient.messages.create(sms,(error,data)=>{
        if(error){
          const twilioErrResponse = {
            headers:headers,
            statusCode:200,
            body:JSON.stringify({
              status:'fail',
              message:error.message,
              error:error
            })
          }
          return callback(null,twilioErrResponse)
        }
        const successResponse = {
          headers:headers,
          statusCode:200,
          body:JSON.stringify({
            status:'success',
            message:'successful sent',
            body:data.body,
            created:data.dateCreated
          })
        }
        callback(null,twilioErrResponse)
        
      })
    }
  })
}