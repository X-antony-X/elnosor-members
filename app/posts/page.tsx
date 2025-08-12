"use client"

import { useState, useEffect, SetStateAction } from "react"
import { motion } from "framer-motion"
import { Plus, Heart, MessageCircle, Edit, Trash2, Send, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Post, Comment } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function PostsPage() {
  const { user, role } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({})

  useEffect(() => {
    // Simulate loading posts
    setTimeout(() => {
      setPosts([
        {
          id: "1",
          content: "مرحباً بكم في اجتماع الشباب هذا الأسبوع! سنتحدث عن أهمية الصلاة في حياتنا اليومية.",
          authorId: "admin1",
          authorName: "أبونا يوسف",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          likes: ["user1", "user2"],
          comments: [
            {
              id: "c1",
              content: "شكراً لك أبونا، موضوع مهم جداً",
              authorId: "user1",
              authorName: "مينا جورج",
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            },
          ],
        },
        {
          id: "2",
          content: "تذكير: اجتماع الشباب غداً الجمعة الساعة 7 مساءً. لا تنسوا إحضار الكتاب المقدس.",
          imageUrl: "/placeholder.svg?height=300&width=500",
          authorId: "admin1",
          authorName: "أبونا مرقس",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          likes: ["user1", "user2", "user3"],
          comments: [],
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    const newPost: Post = {
      id: Date.now().toString(),
      content: newPostContent,
      imageUrl: newPostImage ? URL.createObjectURL(newPostImage) : undefined,
      authorId: user.uid,
      authorName: user.displayName || "مستخدم",
      createdAt: new Date(),
      likes: [],
      comments: [],
    }

    setPosts([newPost, ...posts])
    setNewPostContent("")
    setNewPostImage(null)
  }

  const handleEditPost = async (postId: string, newContent: string) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, content: newContent } : post)))
    setEditingPost(null)
  }

  const handleDeletePost = async (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId))
  }

  const handleLikePost = async (postId: string) => {
    if (!user) return

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const isLiked = post.likes.includes(user.uid)
          return {
            ...post,
            likes: isLiked ? post.likes.filter((uid) => uid !== user.uid) : [...post.likes, user.uid],
          }
        }
        return post
      }),
    )
  }

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim()
    if (!commentText || !user) return

    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentText,
      authorId: user.uid,
      authorName: user.displayName || "مستخدم",
      createdAt: new Date(),
    }

    setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post)))

    setCommentInputs({ ...commentInputs, [postId]: "" })
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) } : post,
      ),
    )
  }

  const canEditPost = (post: Post) => {
    return role === "admin" || post.authorId === user?.uid
  }

  const canDeletePost = (post: Post) => {
    return role === "admin"
  }

  const canDeleteComment = (comment: Comment) => {
    return role === "admin" || comment.authorId === user?.uid
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("posts")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">منشورات وأخبار الخدمة</p>
        </div>

        {role === "admin" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                {t("createPost")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("createPost")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder={t("postContent")}
                  value={newPostContent}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setNewPostContent(e.target.value)}
                  rows={4}
                />
                <Input type="file" accept="image/*" onChange={(e) => setNewPostImage(e.target.files?.[0] || null)} />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setNewPostContent("")}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                    نشر
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      <div className="space-y-6">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.authorName}</p>
                      <p className="text-sm text-gray-500">
                        {post.createdAt.toLocaleDateString("ar-EG")} -{" "}
                        {post.createdAt.toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {role === "admin" && (
                    <div className="flex gap-2">
                      {canEditPost(post) && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingPost(post)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeletePost(post) && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id!)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-900 dark:text-white leading-relaxed">{post.content}</p>

                {post.imageUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={post.imageUrl || "/placeholder.svg"}
                      alt="Post image"
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikePost(post.id!)}
                    className={`gap-2 ${
                      post.likes.includes(user?.uid || "")
                        ? "text-red-600 hover:text-red-700"
                        : "text-gray-600 hover:text-gray-700"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.likes.includes(user?.uid || "") ? "fill-current" : ""}`} />
                    {post.likes.length}
                  </Button>

                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments.length}
                  </Button>
                </div>

                {/* Comments Section */}
                {post.comments.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="text-xs">{comment.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{comment.authorName}</p>
                              {canDeleteComment(comment) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(post.id!, comment.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{comment.createdAt.toLocaleString("ar-EG")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex gap-2 pt-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.photoURL || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="اكتب تعليقاً..."
                      value={commentInputs[post.id!] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id!]: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(post.id!)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id!)}
                      disabled={!commentInputs[post.id!]?.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">لا توجد منشورات حتى الآن</p>
            {role === "admin" && <p className="text-sm text-gray-400 mt-2">كن أول من ينشر محتوى للأعضاء</p>}
          </motion.div>
        )}
      </div>

      {/* Edit Post Dialog */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل المنشور</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editingPost.content}
                onChange={(e: { target: { value: any } }) => setEditingPost({ ...editingPost, content: e.target.value })}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingPost(null)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => handleEditPost(editingPost.id!, editingPost.content)}>{t("save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
