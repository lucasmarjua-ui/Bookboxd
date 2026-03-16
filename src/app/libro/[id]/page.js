'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Libro() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [reviews, setReviews] = useState([])
  const [user, setUser] = useState(null)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [authorKey, setAuthorKey] = useState(null)
  const [customCover, setCustomCover] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverMessage, setCoverMessage] = useState(null)
  const [likes, setLikes] = useState({})
  const [comments, setComments] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [submittingComment, setSubmittingComment] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadData() {
      const res = await fetch(`https://openlibrary.org/works/${id}.json`)
      const data = await res.json()
      const coverId = data.covers?.[0]

      let authorName = 'Unknown author'
      if (data.authors?.[0]?.author?.key) {
        const authorRes = await fetch(`https://openlibrary.org${data.authors[0].author.key}.json`)
        const authorData = await authorRes.json()
        authorName = authorData.name || 'Unknown author'
        setAuthorKey(data.authors[0].author.key.replace('/authors/', ''))
      }

      const { data: coverData } = await supabase
        .from('custom_covers')
        .select('cover_url')
        .eq('book_id', id)
        .single()
      if (coverData) setCustomCover(coverData.cover_url)

      setBook({
        id,
        title: data.title,
        author: authorName,
        description: typeof data.description === 'string'
          ? data.description
          : data.description?.value || '',
        cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
      })

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      await loadReviews(id, user)
      setLoading(false)
    }
    loadData()
  }, [id])

  async function loadReviews(bookId, currentUser) {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })

    const reviewList = reviewsData || []
    setReviews(reviewList)

    if (currentUser) {
      const existing = reviewList.find(r => r.user_id === currentUser.id)
      if (existing) {
        setRating(existing.rating)
        setContent(existing.content || '')
      }
    }

    // Cargar likes y comentarios de todas las reseñas
    if (reviewList.length > 0) {
      const reviewIds = reviewList.map(r => r.id)

      const { data: likesData } = await supabase
        .from('review_likes')
        .select('*')
        .in('review_id', reviewIds)

      const { data: commentsData } = await supabase
        .from('review_comments')
        .select('*, profiles(username)')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true })

      // Organizar likes por reseña
      const likesMap = {}
      for (const review of reviewList) {
        const reviewLikes = (likesData || []).filter(l => l.review_id === review.id)
        likesMap[review.id] = {
          count: reviewLikes.length,
          liked: currentUser ? reviewLikes.some(l => l.user_id === currentUser.id) : false,
        }
      }
      setLikes(likesMap)

      // Organizar comentarios por reseña
      const commentsMap = {}
      for (const review of reviewList) {
        commentsMap[review.id] = (commentsData || []).filter(c => c.review_id === review.id)
      }
      setComments(commentsMap)
    }
  }

  async function handleLike(reviewId) {
    if (!user) return
    const isLiked = likes[reviewId]?.liked

    if (isLiked) {
      await supabase.from('review_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('review_id', reviewId)
    } else {
      await supabase.from('review_likes')
        .insert({ user_id: user.id, review_id: reviewId })
    }

    setLikes(prev => ({
      ...prev,
      [reviewId]: {
        count: (prev[reviewId]?.count || 0) + (isLiked ? -1 : 1),
        liked: !isLiked,
      }
    }))
  }

  async function handleComment(reviewId) {
    const text = newComment[reviewId]?.trim()
    if (!text || !user) return

    setSubmittingComment(prev => ({ ...prev, [reviewId]: true }))

    const { data, error } = await supabase
      .from('review_comments')
      .insert({
        user_id: user.id,
        review_id: reviewId,
        content: text,
      })
      .select('*, profiles(username)')
      .single()

    if (!error && data) {
      setComments(prev => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), data],
      }))
      setNewComment(prev => ({ ...prev, [reviewId]: '' }))
    }

    setSubmittingComment(prev => ({ ...prev, [reviewId]: false }))
  }

  async function handleDeleteComment(reviewId, commentId) {
    await supabase.from('review_comments').delete().eq('id', commentId)
    setComments(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || []).filter(c => c.id !== commentId),
    }))
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCoverMessage({ type: 'error', text: 'Please select an image file.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverMessage({ type: 'error', text: 'Image must be under 5MB.' })
      return
    }
    setUploadingCover(true)
    setCoverMessage(null)
    const ext = file.name.split('.').pop()
    const filename = `${id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('covers').upload(filename, file, { upsert: true })
    if (uploadError) {
      setCoverMessage({ type: 'error', text: 'Error uploading image.' })
      setUploadingCover(false)
      return
    }
    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename)
    const publicUrl = urlData.publicUrl
    const { error: dbError } = await supabase.from('custom_covers').upsert({
      book_id: id, cover_url: publicUrl, uploaded_by: user.id,
    }, { onConflict: 'book_id' })
    if (dbError) {
      setCoverMessage({ type: 'error', text: 'Error saving cover.' })
    } else {
      await supabase.from('booklist').update({ book_cover: publicUrl }).eq('book_id', id)
      await supabase.from('reviews').update({ book_cover: publicUrl }).eq('book_id', id)
      setCustomCover(publicUrl)
      setCoverMessage({ type: 'success', text: 'Cover updated for everyone.' })
    }
    setUploadingCover(false)
    setTimeout(() => setCoverMessage(null), 3000)
  }

  async function handleRemoveCover() {
    const { error } = await supabase.from('custom_covers').delete().eq('book_id', id)
    if (!error) {
      const originalCover = book.cover
      await supabase.from('booklist').update({ book_cover: originalCover }).eq('book_id', id)
      await supabase.from('reviews').update({ book_cover: originalCover }).eq('book_id', id)
      setCustomCover(null)
      setCoverMessage({ type: 'success', text: 'Custom cover removed.' })
      setTimeout(() => setCoverMessage(null), 3000)
    }
  }

  async function handleSubmitReview() {
    if (!user) { setMessage({ type: 'error', text: 'You must be signed in to write a review.' }); return }
    if (rating === 0) { setMessage({ type: 'error', text: 'Please select a rating.' }); return }
    setSubmitting(true)
    const { error } = await supabase.from('reviews').upsert({
      user_id: user.id,
      book_id: id,
      book_title: book.title,
      book_cover: customCover || book.cover,
      book_author: book.author,
      rating,
      content,
    }, { onConflict: 'user_id,book_id' })
    await supabase.from('booklist').upsert({
      user_id: user.id,
      book_id: id,
      book_title: book.title,
      book_cover: customCover || book.cover,
      book_author: book.author,
      status: 'read',
    }, { onConflict: 'user_id,book_id' })
    if (error) {
      setMessage({ type: 'error', text: 'Error posting review.' })
    } else {
      setMessage({ type: 'success', text: 'Review posted and book marked as read.' })
      await loadReviews(id, user)
    }
    setSubmitting(false)
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <span className="text-[#c9a84c] text-4xl">✦</span>
          <p className="text-[#a89070] mt-4">Loading book...</p>
        </div>
      </main>
    )
  }

  const displayCover = customCover || book.cover
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">

      {/* Info del libro */}
      <div className="flex gap-10 mb-12">
        <div className="shrink-0 flex flex-col items-center gap-3">
          <div className="relative group">
            {displayCover ? (
              <img src={displayCover} alt={book.title}
                className="w-40 rounded-lg shadow-2xl shadow-black/50" />
            ) : (
              <div className="w-40 h-56 bg-[#1e1a10] border border-[#c9a84c20] rounded-lg flex items-center justify-center text-[#c9a84c30] text-4xl">📖</div>
            )}
            {user && (
              <div onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 cursor-pointer">
                <span className="text-2xl">📷</span>
                <span className="text-[#e8dcc8] text-xs tracking-wider text-center px-2">
                  {uploadingCover ? 'Uploading...' : 'Change cover'}
                </span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          {user && (
            <div className="flex flex-col items-center gap-2 w-40">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingCover}
                className="w-full text-xs border border-[#c9a84c30] hover:border-[#c9a84c] text-[#a89070] hover:text-[#c9a84c] py-1.5 rounded-lg transition">
                {uploadingCover ? 'Uploading...' : '📷 Change cover'}
              </button>
              {customCover && (
                <button onClick={handleRemoveCover}
                  className="w-full text-xs border border-[#6a2010] hover:bg-[#6a2010] text-[#c87040] py-1.5 rounded-lg transition">
                  ✕ Remove custom
                </button>
              )}
            </div>
          )}
          {coverMessage && (
            <p className={`text-xs text-center w-40 ${coverMessage.type === 'success' ? 'text-[#a8c870]' : 'text-[#c87040]'}`}>
              {coverMessage.text}
            </p>
          )}
          {customCover && <span className="text-[#c9a84c] text-xs tracking-wider">✦ Custom cover</span>}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2">Book details</p>
          <h1 style={{fontFamily: 'var(--font-playfair)'}}
            className="text-4xl font-bold text-[#e8dcc8] mb-2 leading-tight">{book.title}</h1>
          {authorKey ? (
            <Link href={`/autor/${authorKey}`}
              className="text-[#a89070] hover:text-[#c9a84c] text-sm mb-4 transition inline-block">
              {book.author} →
            </Link>
          ) : (
            <p className="text-[#a89070] text-sm mb-4">{book.author}</p>
          )}
          {avgRating && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={star <= Math.round(avgRating) ? 'text-[#c9a84c] text-xl' : 'text-[#3a3020] text-xl'}>★</span>
                ))}
              </div>
              <span className="text-[#e8dcc8] font-semibold">{avgRating}</span>
              <span className="text-[#a89070] text-sm">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
          {book.description && (
            <p className="text-[#a89070] text-sm leading-relaxed line-clamp-5 italic">{book.description}</p>
          )}
        </div>
      </div>

      <div className="h-px bg-[#c9a84c20] mb-10" />

      {/* Formulario de reseña */}
      <section className="bg-[#12100a] border border-[#c9a84c20] rounded-xl p-7 mb-10">
        <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-xl font-bold text-[#e8dcc8] mb-5">
          {user ? 'Your review' : 'Write a review'}
        </h2>
        <div className="flex gap-1 mb-5">
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition hover:scale-110">
              <span className={star <= (hoverRating || rating) ? 'text-[#c9a84c]' : 'text-[#2a2010]'}>★</span>
            </button>
          ))}
          {(hoverRating || rating) > 0 && (
            <span className="text-[#a89070] text-sm self-center ml-2">
              {['','Terrible','Poor','Good','Great','Masterpiece'][hoverRating || rating]}
            </span>
          )}
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="What did you think of this book?" rows={4}
          className="w-full bg-[#1e1a10] border border-[#c9a84c20] focus:border-[#c9a84c] rounded px-5 py-3 text-[#e8dcc8] placeholder-[#5a4a30] outline-none transition resize-none mb-4"
          style={{fontFamily: 'var(--font-lora)'}} />
        {message && (
          <div className={`mb-4 px-5 py-3 rounded text-sm border ${
            message.type === 'success' ? 'bg-[#1a2010] border-[#4a6a20] text-[#a8c870]' : 'bg-[#201008] border-[#6a2010] text-[#c87040]'
          }`}>{message.text}</div>
        )}
        <button onClick={handleSubmitReview} disabled={submitting}
          className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#5a4a20] text-[#12100a] font-semibold px-8 py-2.5 rounded transition tracking-wider text-sm">
          {submitting ? 'Publishing...' : 'Post review'}
        </button>
      </section>

      {/* Lista de reseñas */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 style={{fontFamily: 'var(--font-playfair)'}} className="text-2xl font-bold text-[#e8dcc8]">Reviews</h2>
          <div className="h-px flex-1 bg-[#c9a84c20]" />
        </div>

        {reviews.length === 0 ? (
          <p className="text-[#a89070] italic">Be the first to review this book.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {reviews.map(review => {
              const reviewLikes = likes[review.id] || { count: 0, liked: false }
              const reviewComments = comments[review.id] || []
              const isOpen = openComments[review.id]

              return (
                <div key={review.id} className="bg-[#12100a] border border-[#c9a84c15] rounded-xl p-6">

                  {/* Cabecera reseña */}
                  <div className="flex items-center justify-between mb-3">
                    <span style={{fontFamily: 'var(--font-playfair)'}} className="font-semibold text-[#c9a84c]">
                      {review.profiles?.username}
                    </span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= review.rating ? 'text-[#c9a84c]' : 'text-[#2a2010]'}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Texto reseña */}
                  {review.content && (
                    <p className="text-[#a89070] text-sm leading-relaxed italic mb-4">"{review.content}"</p>
                  )}

                  <p className="text-[#3a3020] text-xs mb-4">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>

                  {/* Acciones */}
                  <div className="flex items-center gap-4 pt-3 border-t border-[#c9a84c10]">
                    <button
                      onClick={() => handleLike(review.id)}
                      disabled={!user}
                      className={`flex items-center gap-1.5 text-xs transition ${
                        reviewLikes.liked
                          ? 'text-[#c9a84c]'
                          : 'text-[#5a4a30] hover:text-[#c9a84c]'
                      } disabled:cursor-default`}>
                      <span className="text-base">{reviewLikes.liked ? '♥' : '♡'}</span>
                      <span>{reviewLikes.count > 0 ? reviewLikes.count : ''}</span>
                    </button>

                    <button
                      onClick={() => setOpenComments(prev => ({ ...prev, [review.id]: !isOpen }))}
                      className="flex items-center gap-1.5 text-xs text-[#5a4a30] hover:text-[#a89070] transition">
                      <span className="text-base">💬</span>
                      <span>{reviewComments.length > 0 ? reviewComments.length : ''} {isOpen ? 'Hide' : 'Comment'}</span>
                    </button>
                  </div>

                  {/* Comentarios */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-[#c9a84c10]">
                      {reviewComments.length > 0 && (
                        <div className="flex flex-col gap-3 mb-4">
                          {reviewComments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#2a2010] border border-[#c9a84c20] flex items-center justify-center text-[#c9a84c] text-xs shrink-0 font-bold">
                                {comment.profiles?.username?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 bg-[#1a1408] rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[#c9a84c] text-xs font-semibold">
                                    {comment.profiles?.username}
                                  </span>
                                  {user?.id === comment.user_id && (
                                    <button
                                      onClick={() => handleDeleteComment(review.id, comment.id)}
                                      className="text-[#3a2010] hover:text-[#c87040] text-xs transition">
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <p className="text-[#a89070] text-xs mt-0.5">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {user ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment[review.id] || ''}
                            onChange={e => setNewComment(prev => ({ ...prev, [review.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleComment(review.id)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-[#1a1408] border border-[#c9a84c20] focus:border-[#c9a84c] rounded-lg px-4 py-2 text-[#e8dcc8] placeholder-[#3a2a10] outline-none transition text-xs"
                            style={{fontFamily: 'var(--font-lora)'}}
                          />
                          <button
                            onClick={() => handleComment(review.id)}
                            disabled={submittingComment[review.id] || !newComment[review.id]?.trim()}
                            className="bg-[#c9a84c] hover:bg-[#d4b86a] disabled:bg-[#3a2a10] text-[#12100a] font-semibold px-4 py-2 rounded-lg transition text-xs">
                            {submittingComment[review.id] ? '...' : 'Post'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[#5a4a30] text-xs italic">
                          <Link href="/login" className="text-[#c9a84c] hover:text-[#d4b86a] transition">Sign in</Link> to comment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

    </main>
  )
}