"""Player progress (stats, history and achievements)

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-13
"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

STAT_COLUMNS = (
    "current_streak",
    "max_streak",
    "last_streak_day",
    "games_played",
    "total_score",
    "morph_correct_streak",
    "morph_correct_streak_max",
    "syntax_correct_streak",
    "syntax_correct_streak_max",
    "synonyms_correct_streak",
    "synonyms_correct_streak_max",
    "total_correct_morph",
    "total_correct_syntax",
    "total_correct_synonyms",
)


def upgrade():
    op.create_table(
        "user_stats",
        *(sa.Column(name, sa.Integer(), nullable=False) for name in STAT_COLUMNS),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_table(
        "history_entry",
        sa.Column("day_id", sa.Integer(), nullable=False),
        sa.Column("study_type", sa.String(length=20), nullable=False),
        sa.Column("correct", sa.Boolean(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("base", sa.Integer(), nullable=False),
        sa.Column("bonus", sa.Integer(), nullable=False),
        sa.Column("is_milestone", sa.Boolean(), nullable=False),
        sa.Column("streak_after", sa.Integer(), nullable=False),
        sa.Column("time_ms", sa.Integer(), nullable=False),
        sa.Column("is_archive", sa.Boolean(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("played_on", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "day_id", "study_type"),
    )
    op.create_index(
        op.f("ix_history_entry_played_on"), "history_entry", ["played_on"]
    )
    op.create_table(
        "achievement_unlocked",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "achievement_id",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=False,
        ),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "achievement_id"),
    )


def downgrade():
    op.drop_table("achievement_unlocked")
    op.drop_index(op.f("ix_history_entry_played_on"), table_name="history_entry")
    op.drop_table("history_entry")
    op.drop_table("user_stats")
