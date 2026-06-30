# ImageKit.io Setup - LOUD BRANDS

You have successfully migrated the upload server to use **ImageKit.io** instead of the disabled Cloudinary account. 

---

## 1. Heroku Environment Setup

Run this command in your terminal to set your ImageKit credentials on Heroku:

```bash
heroku config:set IMAGEKIT_PUBLIC_KEY="public_S1l4aVQSRASe0UaFB5rvoF6VKRA=" IMAGEKIT_PRIVATE_KEY="private_MgSLxVqeuKC4I0iePxEgU0JnQOM=" IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/qxjvunzvo" -a loudbrands-backend-eu-abfa65dd1df6
```

---

## 2. Deploy Backend Code to Heroku

After configuring the variables, commit the changes and push them to Heroku:

```bash
# Add files to git
git add .

# Commit changes
git commit -m "Migrate backend image uploads to ImageKit"

# Push to Heroku
git push heroku main
```

---

## 3. Verify
1. Go to `https://loudbrandss.com/admin/products/new`.
2. Try uploading a product image. It should upload to ImageKit.io successfully and display instantly on the screen!
