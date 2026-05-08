require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log("REQ HIT:", req.method, req.url);
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo error:", err));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready");
  }
});

const OrderItemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    slug: String,
    image: String,
    price: Number,
    size: String,
    qty: Number
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  items: {
    type: [OrderItemSchema],
    default: []
  },

  total: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    default: "cod"
  },

  paymentStatus: {
    type: String,
    default: "pending"
  },

  orderStatus: {
    type: String,
    enum: ["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"],
    default: "Pending"
  },

  statusHistory: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],

  date: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", OrderSchema);

function getDatePart() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

async function generateOrderId() {
  const today = getDatePart();

  const count = await Order.countDocuments({
    orderId: { $regex: `^GL-${today}-` }
  });

  const serial = String(count + 1).padStart(3, "0");
  return `GL-${today}-${serial}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidPhone(phone) {
  return /^[0-9]{10}$/.test(String(phone).trim());
}

function isValidStatus(status) {
  return ["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"].includes(status);
}

function getTrackLink(orderId, email) {
  return `http://127.0.0.1:5500/track.html?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`;
}

function buildItemsHtml(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <tr>
        <td colspan="5" style="padding:12px;border-bottom:1px solid #eee;">No item details available.</td>
      </tr>
    `;
  }

  return items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.name || "Product"}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">`
            : "-"
        }
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;">${item.name || "Product"}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">${item.size || "-"}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">${item.qty || 1}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">₹${Number(item.price || 0).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");
}

async function sendOrderEmails(order) {
  const trackLink = getTrackLink(order.orderId, order.email);
  const itemsHtml = buildItemsHtml(order.items);

  const customerHtml = `
    <div style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#111;">
      <div style="max-width:700px;margin:0 auto;padding:32px 20px;">
        <div style="background:#111;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;font-size:28px;">Gully Labs</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:.85;">Order Confirmation</p>
        </div>

        <div style="background:#fff;padding:28px 24px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 16px 16px;">
          <h2 style="margin:0 0 10px;font-size:26px;">Thank you for your order, ${order.name}!</h2>
          <p style="margin:0 0 16px;color:#555;line-height:1.6;">
            Your order has been placed successfully.
          </p>

          <div style="background:#fafafa;border:1px solid #ececec;border-radius:14px;padding:18px 16px;margin-bottom:22px;">
            <p style="margin:0 0 10px;"><b>Order ID:</b> ${order.orderId}</p>
            <p style="margin:0 0 10px;"><b>Status:</b> ${order.orderStatus}</p>
            <p style="margin:0 0 10px;"><b>Total:</b> ₹${Number(order.total || 0).toLocaleString("en-IN")}</p>
            <p style="margin:0 0 10px;"><b>Payment Method:</b> ${order.paymentMethod || "cod"}</p>
            <p style="margin:0;"><b>Delivery Address:</b> ${order.address}</p>
          </div>

          <h3 style="margin:0 0 12px;font-size:18px;">Items Ordered</h3>
          <table style="width:100%;border-collapse:collapse;border:1px solid #ececec;border-radius:14px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr>
                <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Image</th>
                <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Product</th>
                <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Size</th>
                <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Qty</th>
                <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align:center;margin-top:28px;">
            <a href="${trackLink}"
              style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;margin-right:10px;">
              Track Your Order
            </a>

            <a href="http://127.0.0.1:5500/shop.html"
              style="display:inline-block;background:#fff;color:#111;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;border:1px solid #ddd;">
              Continue Shopping
            </a>
          </div>

          <p style="margin:28px 0 0;color:#666;font-size:13px;line-height:1.6;">
            Need help? Reply to this email and our team will get back to you.
          </p>
        </div>
      </div>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;padding:24px;color:#111;">
      <h2>New Order Received</h2>

      <p><b>Order ID:</b> ${order.orderId}</p>
      <p><b>Name:</b> ${order.name}</p>
      <p><b>Email:</b> ${order.email}</p>
      <p><b>Phone:</b> ${order.phone}</p>
      <p><b>Total:</b> ₹${Number(order.total || 0).toLocaleString("en-IN")}</p>
      <p><b>Address:</b> ${order.address}</p>
      <p><b>Status:</b> ${order.orderStatus}</p>

      <h3 style="margin-top:24px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ececec;">
        <thead>
          <tr>
            <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Image</th>
            <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Product</th>
            <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Size</th>
            <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Qty</th>
            <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `New Order Received - ${order.orderId}`,
    html: adminHtml
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: order.email,
    subject: `Your Order is Confirmed - ${order.orderId}`,
    html: customerHtml
  });
}

function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const parts = authHeader.split(" ");
  const token = parts[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden"
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token"
    });
  }
}

app.post("/admin/login", (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required"
      });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }

    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
});

app.post("/order", async (req, res) => {
  console.log("ORDER ROUTE HIT");
  console.log("BODY:", req.body);
  try {
    const {
      name,
      email,
      phone,
      address,
      items,
      total,
      paymentMethod
    } = req.body;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: "All customer details are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address"
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be 10 digits"
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty"
      });
    }

    if (!total || Number(total) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid order total"
      });
    }

    const newOrderId = await generateOrderId();

    const order = new Order({
      orderId: newOrderId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      items,
      total: Number(total),
      paymentMethod: paymentMethod || "cod",
      paymentStatus: "pending",
      orderStatus: "Pending",
      statusHistory: [
        {
          status: "Pending",
          timestamp: new Date()
        }
      ]
    });

    await order.save();

    try {
      await sendOrderEmails(order);
      console.log("Admin and customer emails sent successfully");
    } catch (mailError) {
      console.error("Email send error:", mailError);
    }

    return res.status(201).json({
      success: true,
      message: "Order saved successfully",
      orderId: newOrderId,
      order
    });
  } catch (error) {
    console.error("Order save error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/orders", verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    return res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.put("/orders/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date()
    });

    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.patch("/admin/orders/:orderId/status", verifyAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!isValidStatus(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order status"
      });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date()
    });

    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete("/orders/:id", verifyAdmin, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post("/track-order", async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({
        success: false,
        error: "Order ID and email are required"
      });
    }

    const order = await Order.findOne({
      orderId: String(orderId).trim(),
      email: String(email).trim().toLowerCase()
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    return res.json({
      success: true,
      order: {
        orderId: order.orderId,
        name: order.name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory,
        date: order.date
      }
    });
  } catch (error) {
    console.error("Track order error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/my-orders", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const orders = await Order.find({ email }).sort({ date: -1 });

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("My orders error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Gully Labs backend is running");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});