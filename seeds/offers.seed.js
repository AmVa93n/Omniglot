const mongoose = require('mongoose');
const User = require('../models/User.model');
const Offer = require('../models/Offer.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ironhack-project2';

const locTypes = ['online','at-student','at-teacher']
const classTypes = ['private','group']
const levels = ['beginner','intermediate','advanced']
const durations = [45,60,90,120,150,180]

// seed database with 1-5 offers per professional profile
async function seedDatabase() {
    await mongoose.connect(MONGO_URI)
    const profUsers = await User.find({professional: true})
    
    for (let user of profUsers) {
        let offerCount = getRandomNumber(1,5)

        for (let i = 1; i < offerCount+1; i++) {
            let locationType = randomElement(locTypes)
            let classType = randomElement(classTypes)
            if (locationType != "online") classType = "private"
            let maxGroupSize = classType == 'group' ? getRandomNumber(2,15) : null
            let offer = {
                name: "my amazing offer "+i,
                language: randomElement(user.lang_teach),
                level: randomElement(levels),
                locationType,
                classType,
                maxGroupSize,
                duration: randomElement(durations),
                price: getRandomNumber(10,100),
            }
            let offerDB = await Offer.create(offer);
            user.offers.push(offerDB._id)
            await user.save()
        }
    }

    await mongoose.connection.close();
  }
  
  function randomElement(array) {
    let index = getRandomNumber(0,array.length-1)
    return array[index]
  }
  
  function randomChance(percentage) {
    return Math.random() * 100 < percentage
  }
  
  function getRandomNumber(min, max) {
    return (Math.floor(Math.random() * (max - min + 1))) + min
  }
  
  // Run the seeding script
  seedDatabase();