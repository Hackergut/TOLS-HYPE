-- Slide allows several targets from the same player in one round.
alter table live_bets drop constraint if exists live_bets_game_id_n_user_id_key;
