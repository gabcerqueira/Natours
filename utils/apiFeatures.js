const tourConstants = require('../constants/tourConstants');
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const filterObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete filterObj[el]);
    console.log(filterObj);
    let queryStr = JSON.stringify(filterObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    const { sort } = this.queryString;
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    const { fields } = this.queryString;
    if (fields) {
      const limitedFields = fields.split(',').join(' ');
      this.query = this.query.select(limitedFields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page =
      this.queryString.page * 1 || tourConstants.PAGE_DEFAULT;
    const limit =
      this.queryString.limit * 1 || tourConstants.PAGE_LIMIT;
    const docsToSkip = (page - 1) * limit;

    this.query = this.query.skip(docsToSkip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
