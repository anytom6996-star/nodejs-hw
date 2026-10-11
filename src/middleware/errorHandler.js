
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
};

export default errorHandler;
