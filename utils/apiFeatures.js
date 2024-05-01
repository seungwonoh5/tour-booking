class APIFeatures{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = {...this.queryString };
        const excludedFields = ['sort', 'fields', 'limit', 'page'] // they should not go into Tour.find()
        excludedFields.forEach(field => delete queryObj[field]);

        // Advanced Filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, match => `$${match}`);
        
        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort(){
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createAt')
        }

        return this;
    }

    limitFields(){
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v')
        }

        return this;
    }

    paginate(){ // 4) Pagination - 1-10 page1 11-20 page2
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 10
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)

        return this;
    }
}

module.exports = APIFeatures;