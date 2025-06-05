# 🚀 FarmBoy v0.2 - Quick Test Guide

## ✅ **Step 1: Start the Server**
```bash
node test-simple-server.js
```
Should show: **"✅ Ready for FarmBoy v0.2 testing with full API support!"**

## ✅ **Step 2: Verify API Endpoints**
Run the endpoint test:
```bash
node test-tasks-endpoint.js
```
Should show: **"🎉 ALL ENDPOINTS WORKING!"**

## ✅ **Step 3: Open the Interface**
Go to: **http://localhost:3007**

## 🔍 **Step 4: Check Connection Status**
Look in the top-right corner:
- Should show: **"✅ Connected"** (green)
- NOT: ❌ Connection Failed

## ⚡ **Step 5: Test Navigation**
Test all navigation tabs:
1. **🏠 Overview** - Should load dashboard with status cards
2. **🤖 Agents** - Should show agents list (no 404 errors)
3. **🔗 Discord** - Should show Discord management panel
4. **🌐 Proxies** - Should show proxies panel
5. **⚙️ Config** - Should show configuration panel

## ⚡ **Step 6: Test Quick Actions (Most Important!)**

### **Overview Section Quick Actions:**
1. Click **"🏠 Overview"** tab
2. Try these buttons in the **"⚡ Quick Actions"** panel:
   - **📢 Send Discord Alert**
   - **🧪 Test Discord** 
   - **📸 Quick Screenshot**

### **Discord Section Quick Actions:**
1. Click **"🔗 Discord"** tab
2. Try these buttons in the **"⚡ Quick Actions"** section:
   - **📊 Send Status Update**
   - **💻 Send System Stats**
   - **🤖 Send Agent Summary**
   - **📸 Screenshot + Stats**
   - **🚨 Send Alert**

## ✅ **Expected Results:**
- ✅ **No 404 errors** (especially "Error loading tasks")
- ✅ Success notifications: "Send Status Update message sent to Discord"
- ✅ Messages appear in **"📜 Recent Messages"** log
- ✅ Real-time updates via WebSocket
- ✅ All navigation tabs load properly
- ✅ Tasks section shows mock data

## 🎯 **Quick Success Check:**
If you can:
1. ✅ **Navigate between all tabs without errors**
2. ✅ **Click any quick action button and see green success notification**
3. ✅ **See messages appear in the Discord log**
4. ✅ **No 404 errors in browser console**

**Then everything is working perfectly!** 🎉

---

## 🛠️ **Troubleshooting:**

**If you see "Error loading tasks":**
- Make sure server shows all API endpoints in startup log
- Run `node test-tasks-endpoint.js` to verify endpoints
- Check browser console for specific 404 errors

**Server Console:** Check terminal for confirmations like:
```
⚡ Quick action requested: Send Status Update
✅ Quick action completed: Send Status Update
📋 Tasks requested: page=1, per_page=10, agent_id=all
``` 

## 🎯 **All Fixed Issues:**
- ✅ Tasks API endpoints implemented
- ✅ Agents API working
- ✅ Discord integration functional
- ✅ WebSocket real-time updates
- ✅ Navigation between sections
- ✅ All quick actions working 