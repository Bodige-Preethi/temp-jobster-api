const Job = require('../models/jobs')
const {StatusCodes} = require('http-status-codes')
const {BadRequestError,NotFoundError} = require('../errors')
const mongoose = require('mongoose')
const moment = require('moment')

const getAllJobs = async (req,res) => {
    const {search,status,jobType,sort} = req.query
    const queryObject = {
        createdBy:req.user.userID
    }

    if(search){
        queryObject.position = {$regex:search,$options:'i'}
    }
    if(status && status !== 'all'){
        queryObject.status = status
    }
    if(jobType && jobType !== 'all'){
        queryObject.jobType = jobType
    }

    let result = Job.find(queryObject);

    if(sort === 'latest'){
        result = result.sort('-createdAt')
    }
    if(sort === 'old'){
        result = result.sort('createdAt')
    }
    if(sort === 'a-z'){
        result = result.sort('position')
    }
    if(sort === 'z-a'){
        result = result.sort('-position')
    }

    const pages = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (pages - 1) * limit
    result = result.skip(skip).limit(limit)

    const jobs = await result

    const totalJobs = await Job.countDocuments(queryObject)
    const numOfPages = Math.ceil(totalJobs/limit)

    res.status(StatusCodes.OK).json({ jobs,totalJobs,numOfPages })
}

const getJob = async (req,res) => {
    const {user:{userID},params:{id:jobID}} = req
    const job = await Job.findOne({_id:jobID,createdBy:userID})
    if(!job){
        throw new NotFoundError(`No job with id ${jobID}`)
    }
    res.status(StatusCodes.OK).json({job})
}

const createJob = async (req,res) => {
    req.body.createdBy = req.user.userID
    const job = await Job.create(req.body)
    res.status(StatusCodes.CREATED).json({job})
}

const updateJob = async (req,res) => {
    const {
        body:{company,position},
        user:{userID},
        params:{id:jobID}
    } = req
    if(company === '' || position === ''){
        throw new BadRequestError('Company and Position fields cannot be empty')
    }
    const job = await Job.findOneAndUpdate({_id:jobID,createdBy:userID},req.body,{new:true,runValidator:true})
    if(!job){
        throw new NotFoundError(`No job with id ${jobID}`)
    }
    res.status(StatusCodes.OK).json({job})
}

const deleteJob = async (req,res) => {
    const {user:{userID},params:{id:jobID}} = req
    const job = await Job.findOneAndDelete({_id:jobID,createdBy:userID})
    if(!job){
        throw new NotFoundError(`No job with id ${jobID}`)
    }
    res.status(StatusCodes.OK).send()
}

const showStats = async (req,res) => {
    let stats = await Job.aggregate([
        {$match:{createdBy:new mongoose.Types.ObjectId(req.user.userID)}},
        {$group:{_id:'$status',count:{$sum:1}}},
    ])

    stats = stats.reduce((acc,curr) => {
        const {_id:title,count} = curr
        acc[title] = count
        return acc
    },{})

    const defaultStats = {
        pending:stats.pending || 0,
        interview:stats.interview || 0,
        declined:stats.declined || 0,
    }
    
    let monthlyApplications = await Job.aggregate([
        {$match:{createdBy:new mongoose.Types.ObjectId(req.user.userID)}},
        {$group:{
            _id:{year:{$year:'$createdAt'},month:{$month:'$createdAt'}},
            count:{$sum:1},
        },
    },
    {$sort:{'_id.year':-1,'_id.month':-1}},
    {$limit:6},
    ])
    monthlyApplications = monthlyApplications.map((item) => {
        const {_id:{year,month},count} = item
        const date = moment().month(month-1).year(year).format('MMM Y')
        return {date,count}

    }).reverse()

    res.status(StatusCodes.OK).json({defaultStats,monthlyApplications})
}
module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    showStats,
}