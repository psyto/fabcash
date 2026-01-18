module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fabcash-privacy-backend',
    timestamp: new Date().toISOString(),
  });
};
