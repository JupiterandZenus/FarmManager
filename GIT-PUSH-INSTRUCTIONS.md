# Git Push Instructions

Follow these steps to push the database refresh changes to your Git repository.

## Prerequisites

- Git must be installed on your system
- You must have access to the target Git repository

## Step-by-Step Instructions

### 1. Open a New Command Prompt or PowerShell Window

1. Press `Win + R` to open the Run dialog
2. Type `cmd` or `powershell` and press Enter
3. Navigate to your project directory:
   ```
   cd C:\Users\SupScotty\Downloads\farm-admin-enablevnc
   ```

### 2. Check Git Status

```
git status
```

This will show you all modified files.

### 3. Add All Files to Git

```
git add .
```

### 4. Commit Your Changes

```
git commit -m "Add database refresh functionality"
```

### 5. Check Current Branch

```
git branch
```

The current branch will be marked with an asterisk (*).

### 6. Switch to or Create the Farmboy Branch

If the branch exists:
```
git checkout Farmboy
```

If the branch doesn't exist:
```
git checkout -b Farmboy
```

### 7. Push Changes to Remote Repository

```
git push -u origin Farmboy
```

If this is your first time pushing to this repository, you may be prompted to enter your credentials.

## Troubleshooting

### If Git is not initialized:

```
git init
git add .
git commit -m "Add database refresh functionality"
git remote add origin <your-repository-url>
git checkout -b Farmboy
git push -u origin Farmboy
```

### If you encounter authentication issues:

1. Set up credential storage:
   ```
   git config --global credential.helper store
   ```

2. Try pushing again:
   ```
   git push -u origin Farmboy
   ```

3. Enter your username and password/token when prompted

### If you encounter merge conflicts:

1. Pull the latest changes:
   ```
   git pull origin Farmboy
   ```

2. Resolve any conflicts in the files
3. Add the resolved files:
   ```
   git add .
   ```

4. Commit the merge:
   ```
   git commit -m "Merge and resolve conflicts"
   ```

5. Push again:
   ```
   git push origin Farmboy
   ```

## Summary of Changes

See the `DATABASE-REFRESH-CHANGES.md` file for a complete summary of all the changes made for the database refresh functionality. 