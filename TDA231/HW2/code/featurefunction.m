function [variance] = featurefunction(image)

image = (1/255)*image;
mat = vec2mat(image, 16);

variance = zeros(32,1);

for i = 1:16
    [m, s] = sgeass22(mat(i,:));
    variance(i) = s;
    [m, s] = sgeass22(mat(:,i));
    variance(i+16) = s;
end



