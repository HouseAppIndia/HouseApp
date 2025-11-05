const { AboutUs, PrivacyPolicies, TermsConditions,ContactUs } = require('../models/staticContent.model');

// About Us
exports.createAboutUs = async (req, res) => {
  try {
    console.log(req.body,"gkjtreik")
    const { content, status } = req.body;
    const about = await AboutUs.createOrUpdate({ title:"Welcome to Our Company", content, status });
    res.status(201).json({ success: true, data: about });
  } catch (err) {
    console.error('Error creating About Us:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAboutUs = async (req, res) => {
  try {
    const data = await AboutUs.findAll();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error getting About Us:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Privacy Policies
exports.createPrivacyPolicy = async (req, res) => {
  try {
    const { content, status } = req.body;
    const policy = await PrivacyPolicies.createOrUpdate({ title:"Privacy-Policy'", content, status });
    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    console.error('Error creating Privacy Policy:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPrivacyPolicies = async (req, res) => {
  try {
    const data = await PrivacyPolicies.findAll();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error getting Privacy Policies:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Terms & Conditions
exports.createTermsConditions = async (req, res) => {
  try {
    const { content, status } = req.body;
    console.log(req.body.content)
    const terms = await TermsConditions.createOrUpdate({ title:"Terms and Conditions", content, status });
    res.status(201).json({ success: true, data: terms });
  } catch (err) {
    console.error('Error creating Terms:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTermsConditions = async (req, res) => {
  try {
    const data = await TermsConditions.findAll();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error getting Terms:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTermsConditions = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    const [updated] = await TermsConditions.update({ title, content, status }, { where: { id } });
    if (updated) {
      const updatedRecord = await TermsConditions.findByPk(id);
      res.status(200).json({ success: true, data: updatedRecord });
    } else {
      res.status(404).json({ success: false, message: 'Terms not found' });
    }
  } catch (err) {
    console.error('Error updating Terms:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.createContactUs = async (req, res) => {
  try {
    console.log(req.body,"gkjtreik")
    const { content, status } = req.body;
    const about = await ContactUs.createOrUpdate({ title:"Contact Support", content, status });
    res.status(201).json({ success: true, data: about });
  } catch (err) {
    console.error('Error creating Contact Us:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getContactUs = async (req, res) => {
  try {
    const data = await ContactUs.findAll();
    console.log(data,"contact us data")
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error getting Contact Us:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
