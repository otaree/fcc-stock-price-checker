/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const axios = require("axios");
const _ = require("lodash");

const { Stock } = require("../models/Stock");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async (req, res) => {
      const query = _.pick(req.query, ["stock", "like"]);
      

      try {
        if (!query.stock || query.stock.length === 0) throw "please provide stock";
        if (Array.isArray(query.stock) && query.stock.length === 2) {
          let stocks = [];
          for (let i = 0; i < query.stock.length; i++) {
            const update = { symbol: query.stock[i] };
            
            const price = await  axios.get(`https://api.iextrading.com/1.0/stock/${query.stock[i]}/price`);

            if (query.like) {
              const checkIp = await Stock.findOne({ symbol: query.stock[i], ips: req.ip  });
            
              if (!checkIp) {
                update["$inc"] = {
                  likes: 1
                };
                update["$push"] = { ips: req.ip};     
              }
            }

            const stock = await Stock.findOneAndUpdate({ symbol: query.stock[i] }, update, { upsert: true, new: true, setDefaultsOnInsert: true });

            stocks.push({
              stock: stock,
              price: price.data
            });
          }
          const parseStock = (doc, otherLike) => {
            return {
                stock: doc.stock.symbol.toUpperCase(),
                price: doc.price,
                rel_likes: doc.stock.likes - otherLike
            }
        }
        
        res.json({
          stockData: [parseStock(stocks[0], stocks[1].stock.likes), parseStock(stocks[1], stocks[0].stock.likes)]
        });

        } else if (typeof query.stock === "string") {
            const update = { symbol: query.stock };
            const price = await  axios.get(`https://api.iextrading.com/1.0/stock/${query.stock}/price`);
            if (query.like) {
              const checkIp = await Stock.findOne({ symbol: query.stock, ips: req.ip  });
            
              if (!checkIp) {
                update["$inc"] = {
                  likes: 1
                };
                update["$push"] = { ips: req.ip};     
              }
            }

            const stock = await Stock.findOneAndUpdate({ symbol: query.stock }, update, { upsert: true, new: true, setDefaultsOnInsert: true });

            
            res.json({
              stockData: {
                stock: stock.symbol.toUpperCase(),
                likes: stock.likes,
                price: price.data
              }
            });
        } else {
          throw "invalid query";
        }
      } catch (e) {
        if (["please provide stock", "invalid query"].includes(e)) {
          res.status(400).json({
            failed: e
          })
        } else {
          res.status(400).json({
            failed: "invalid stock"
          });
        }
      }

    });
    
};
