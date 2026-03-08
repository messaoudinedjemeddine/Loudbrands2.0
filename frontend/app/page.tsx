import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to the Loud Styles product page
  redirect('/loud-styles/products')
}