import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true },
);

projectSchema.index({ 'members.user': 1 });

projectSchema.methods.getMemberRole = function (userId) {
  if (this.owner.toString() === userId.toString()) return 'admin';
  const m = this.members.find((mm) => mm.user.toString() === userId.toString());
  return m ? m.role : null;
};

export const Project = mongoose.model('Project', projectSchema);
