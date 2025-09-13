"use client"

import { useState } from "react"
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
import { usePosts, firestoreHelpers } from "@/hooks/use-firestore"
import { toast } from "@/components/ui/use-toast"

export default function PostsPage() {
  const { user, role } = useAuth()
  const { posts, loading, error } = usePosts()
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({})

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    try {
      await firestoreHelpers.addPost({
        content: newPostContent,
        imageUrl: newPostImage ? URL.createObjectURL(newPostImage) : undefined,
        authorId: user.uid,
        authorName: user.displayName || "مستخدم",
        likes: [],
        comments: [],
      })

      setNewPostContent("")
      setNewPostImage(null)
      toast({ description: "تم نشر المنشور بنجاح", variant: "default" })
      // toast({ description: "تم نشر المنشور بنجاح", variant: "success" })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({ description: "خطأ في نشر المنشور", variant: "destructive" })
    }
  }

  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      await firestoreHelpers.updatePost(postId, { content: newContent })
      setEditingPost(null)
      toast({ description: "تم تحديث المنشور بنجاح", variant: "default" })
      // toast({ description: "تم تحديث المنشور بنجاح", variant: "success" })
    } catch (error) {
      console.error("Error updating post:", error)
      toast({ description: "خطأ في تحديث المنشور", variant: "destructive" })
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await firestoreHelpers.deletePost(postId)
      toast({ description: "تم حذف المنشور بنجاح", variant: "default" })
      // toast({ description: "تم حذف المنشور بنجاح", variant: "success" })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({ description: "خطأ في حذف المنشور", variant: "destructive" })
    }
  }

  const handleLikePost = async (postId: string) => {
    if (!user) return

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const isLiked = post.likes.includes(user.uid)
      const newLikes = isLiked ? post.likes.filter((uid) => uid !== user.uid) : [...post.likes, user.uid]

      await firestoreHelpers.updatePost(postId, { likes: newLikes })
    } catch (error) {
      console.error("Error updating like:", error)
      toast({ description: "خطأ في تحديث الإعجاب", variant: "destructive" })
    }
  }

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim()
    if (!commentText || !user) return

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const newComment: Comment = {
        id: Date.now().toString(),
        content: commentText,
        authorId: user.uid,
        authorName: user.displayName || "مستخدم",
        createdAt: new Date(),
      }

      const updatedComments = [...post.comments, newComment]
      await firestoreHelpers.updatePost(postId, { comments: updatedComments })

      setCommentInputs({ ...commentInputs, [postId]: "" })
      toast({ description: "تم إضافة التعليق بنجاح", variant: "default" })
      // toast({ description: "تم إضافة التعليق بنجاح", variant: "success" })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({ description: "خطأ في إضافة التعليق", variant: "destructive" })
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const updatedComments = post.comments.filter((comment) => comment.id !== commentId)
      await firestoreHelpers.updatePost(postId, { comments: updatedComments })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({ description: "خطأ في حذف التعليق", variant: "destructive" })
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
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
                  onChange={(e) => setNewPostContent(e.target.value)}
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
            <Card glassy>
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
                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
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
